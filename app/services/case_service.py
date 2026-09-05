import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from app.schemas.enums import (
    CaseTypeEnum,
    CaseStatusEnum,
    PriorityEnum,
    StepOwnerEnum,
    AuditActorEnum,
    AuditActionEnum,
)
from app.schemas.case import (
    CaseCreate,
    CaseOut,
    CaseDetailOut,
    CaseFilterParams,
    ComplianceChecklist,
)
from app.schemas.workflow import WorkflowStepOut, StepCompleteRequest, StateTransitionResult
from app.workflows import get_workflow_definition, InvalidTransitionError
from app.services.workflow_engine import workflow_engine
from app.services.audit_service import audit_service


class CaseService:
    """Service layer for Case lifecycle, workflow orchestration, and case queries."""

    def __init__(self):
        # In-memory store for unit tests and local isolation
        self._cases: Dict[str, Dict[str, Any]] = {}
        self._case_steps: Dict[str, List[WorkflowStepOut]] = {}

    def create_case(
        self,
        case_in: CaseCreate,
        db_session: Any = None
    ) -> CaseDetailOut:
        """Creates a new Case, instantiates workflow steps, and auto-advances initial step if configured."""
        case_id = f"case-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        workflow_def = get_workflow_definition(case_in.case_type.value)

        # 1. Initialize workflow steps
        initial_step_id, steps = workflow_engine.initialize_case_steps(
            case_id=case_id,
            case_type=case_in.case_type.value
        )

        initial_step_def = workflow_def.get_initial_step()
        current_state = initial_step_def.key
        current_step_id = initial_step_id
        current_status = initial_step_def.case_status

        # 2. Record Case Created audit event
        audit_service.record_event(
            case_id=case_id,
            actor=AuditActorEnum.CLIENT,
            action=AuditActionEnum.CASE_CREATED,
            metadata={
                "client_id": case_in.client_id,
                "case_type": case_in.case_type.value,
                "priority": case_in.priority.value,
            },
            db_session=db_session
        )

        audit_service.record_event(
            case_id=case_id,
            actor=AuditActorEnum.SYSTEM,
            action=AuditActionEnum.WORKFLOW_STARTED,
            metadata={"initial_state": current_state},
            db_session=db_session
        )

        # 3. If initial step is marked is_auto_advance (e.g. request_received -> bank_statement_required), advance it!
        if initial_step_def.is_auto_advance and initial_step_def.next_state:
            res = workflow_engine.advance_step(
                case_id=case_id,
                case_type=case_in.case_type.value,
                current_state=current_state,
                step_id=current_step_id,
                steps=steps,
                actor=StepOwnerEnum.SYSTEM,
                input_data={"auto_init": True},
                db_session=db_session
            )
            current_state = res.new_state
            current_step_id = res.next_step_id or current_step_id
            current_status = CaseStatusEnum(res.case_status)

        case_record = {
            "id": case_id,
            "client_id": case_in.client_id,
            "adviser_id": case_in.adviser_id or "adv-001",
            "case_type": case_in.case_type,
            "status": current_status,
            "priority": case_in.priority,
            "current_step_id": current_step_id,
            "current_state": current_state,
            "metadata_json": case_in.metadata_json or {},
            "created_at": now,
            "updated_at": now,
        }

        # Store in-memory
        self._cases[case_id] = case_record
        self._case_steps[case_id] = steps

        return self._build_case_detail(case_id, db_session)

    def get_case(self, case_id: str, db_session: Any = None) -> Optional[CaseDetailOut]:
        """Retrieves full case details including steps, compliance state, and active actor requirement."""
        if case_id not in self._cases:
            return None
        return self._build_case_detail(case_id, db_session)

    def list_cases(
        self,
        filters: Optional[CaseFilterParams] = None,
        db_session: Any = None
    ) -> List[CaseOut]:
        """Queries and filters cases."""
        cases = list(self._cases.values())
        if filters:
            if filters.client_id:
                cases = [c for c in cases if c["client_id"] == filters.client_id]
            if filters.adviser_id:
                cases = [c for c in cases if c["adviser_id"] == filters.adviser_id]
            if filters.case_type:
                cases = [c for c in cases if c["case_type"] == filters.case_type]
            if filters.status:
                cases = [c for c in cases if c["status"] == filters.status]
            if filters.priority:
                cases = [c for c in cases if c["priority"] == filters.priority]

        # Sort by updated_at / created_at descending
        cases.sort(key=lambda x: x["created_at"], reverse=True)
        return [
            CaseOut(
                id=c["id"],
                client_id=c["client_id"],
                adviser_id=c["adviser_id"],
                case_type=c["case_type"],
                status=c["status"],
                priority=c["priority"],
                current_step_id=c["current_step_id"],
                current_state=c["current_state"],
                metadata_json=c["metadata_json"],
                created_at=c["created_at"],
                updated_at=c["updated_at"],
            )
            for c in cases
        ]

    def complete_step(
        self,
        case_id: str,
        step_id: str,
        request: StepCompleteRequest,
        db_session: Any = None
    ) -> StateTransitionResult:
        """Completes a workflow step and transitions case state."""
        case_record = self._cases.get(case_id)
        if not case_record:
            raise ValueError(f"Case '{case_id}' not found.")

        steps = self._case_steps.get(case_id, [])

        # Find target step
        step_obj = next((s for s in steps if s.id == step_id or s.key == step_id), None)
        if not step_obj:
            raise ValueError(f"Step '{step_id}' not found in case '{case_id}'.")

        # Validate that the step being completed is actually the active step
        if step_obj.key != case_record["current_state"] and step_obj.id != case_record["current_step_id"]:
            raise InvalidTransitionError(
                f"Step '{step_obj.key}' is not the active step. Current active step is '{case_record['current_state']}'."
            )

        # Execute transition via workflow engine
        result = workflow_engine.advance_step(
            case_id=case_id,
            case_type=case_record["case_type"].value,
            current_state=case_record["current_state"],
            step_id=step_obj.id,
            steps=steps,
            actor=request.actor,
            input_data=request.input_data,
            db_session=db_session,
        )

        # Update case record
        now = datetime.now(timezone.utc)
        case_record["current_state"] = result.new_state
        case_record["current_step_id"] = result.next_step_id or case_record["current_step_id"]
        case_record["status"] = CaseStatusEnum(result.case_status)
        case_record["updated_at"] = now

        if request.input_data:
            case_record["metadata_json"] = {**case_record["metadata_json"], **request.input_data}

        return result

    def _build_case_detail(self, case_id: str, db_session: Any = None) -> CaseDetailOut:
        c = self._cases[case_id]
        steps = self._case_steps.get(case_id, [])
        current_step = next((s for s in steps if s.id == c["current_step_id"] or s.key == c["current_state"]), None)

        # Determine action_required_from
        action_required = current_step.owner.value if current_step and c["status"] != CaseStatusEnum.COMPLETED else None

        # Build compliance checklist based on case progress
        evidence_complete = any(s.key == "bank_statement_validation" and s.status.value == "completed" for s in steps)
        compliance = ComplianceChecklist(
            identity_verified=True,
            consent_valid=True,
            instruction_recorded=True,
            required_evidence_complete=evidence_complete,
            disclosure_delivered=True,
            audit_trail_ready=True,
        )

        provider_ref = c["metadata_json"].get("provider_reference") if c["metadata_json"] else None
        provider_status = "accepted" if c["status"] == CaseStatusEnum.COMPLETED else None

        return CaseDetailOut(
            id=c["id"],
            client_id=c["client_id"],
            adviser_id=c["adviser_id"],
            case_type=c["case_type"],
            status=c["status"],
            priority=c["priority"],
            current_step_id=c["current_step_id"],
            current_state=c["current_state"],
            metadata_json=c["metadata_json"],
            created_at=c["created_at"],
            updated_at=c["updated_at"],
            current_step=current_step,
            steps=steps,
            compliance_state=compliance,
            action_required_from=action_required,
            provider_status=provider_status,
            provider_reference=provider_ref,
        )

    def clear(self):
        """Clears in-memory store for testing."""
        self._cases.clear()
        self._case_steps.clear()


case_service = CaseService()
