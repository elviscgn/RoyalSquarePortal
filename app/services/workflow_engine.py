import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple, List
from app.schemas.enums import (
    StepOwnerEnum,
    StepStatusEnum,
    CaseStatusEnum,
    AuditActorEnum,
    AuditActionEnum,
)
from app.schemas.workflow import StateTransitionResult, WorkflowStepOut
from app.workflows import (
    get_workflow_definition,
    BaseWorkflowDefinition,
    StepDefinition,
    WorkflowException,
    InvalidTransitionError,
    PreconditionNotMetError,
    UnauthorizedActionError,
)
from app.services.audit_service import audit_service
from app.services.provider_adapter import provider_adapter


class WorkflowEngine:
    """Core state machine engine that validates transitions, enforces preconditions, and coordinates side effects."""

    def initialize_case_steps(self, case_id: str, case_type: str) -> Tuple[str, List[WorkflowStepOut]]:
        """Instantiates the initial workflow steps for a new case."""
        workflow_def = get_workflow_definition(case_type)
        step_definitions = workflow_def.get_all_steps()

        steps: List[WorkflowStepOut] = []
        for step_def in step_definitions:
            status = StepStatusEnum.IN_PROGRESS if step_def.key == workflow_def.initial_state else StepStatusEnum.PENDING
            steps.append(
                WorkflowStepOut(
                    id=f"step-{uuid.uuid4().hex[:8]}",
                    case_id=case_id,
                    key=step_def.key,
                    title=step_def.title,
                    owner=step_def.owner,
                    status=status,
                    order=step_def.order,
                    required_evidence=step_def.required_evidence,
                    due_date=None,
                    completed_at=None,
                    metadata_json={},
                )
            )

        initial_step = steps[0]
        return initial_step.id, steps

    def advance_step(
        self,
        case_id: str,
        case_type: str,
        current_state: str,
        step_id: str,
        steps: List[WorkflowStepOut],
        actor: StepOwnerEnum,
        input_data: Optional[Dict[str, Any]] = None,
        db_session: Any = None,
    ) -> StateTransitionResult:
        """Executes an explicit transition from current step to next step with full validation."""
        workflow_def = get_workflow_definition(case_type)
        current_def = workflow_def.get_step(current_state)

        if not current_def:
            raise InvalidTransitionError(f"Current state '{current_state}' not found in workflow definition.")

        target_state = current_def.next_state
        if not target_state:
            raise InvalidTransitionError(f"Step '{current_state}' is already a terminal state.")

        # 1. Validate permissions and transition legality
        workflow_def.validate_transition(
            current_state=current_state,
            target_state=target_state,
            actor=actor,
            input_data=input_data
        )

        # 2. Validate domain preconditions
        workflow_def.validate_step_preconditions(
            step_key=current_state,
            actor=actor,
            input_data=input_data
        )

        # 3. Find current step in list and mark complete
        target_def = workflow_def.get_step(target_state)
        now = datetime.now(timezone.utc)

        current_step_obj = next((s for s in steps if s.id == step_id or s.key == current_state), None)
        if current_step_obj:
            current_step_obj.status = StepStatusEnum.COMPLETED
            current_step_obj.completed_at = now
            if input_data:
                current_step_obj.metadata_json = {**(current_step_obj.metadata_json or {}), **input_data}

        # 4. Find next step in list and mark active
        next_step_obj = next((s for s in steps if s.key == target_state), None)
        next_step_id = None
        if next_step_obj:
            next_step_obj.status = StepStatusEnum.IN_PROGRESS
            next_step_id = next_step_obj.id

        # 5. Log audit event
        audit_actor = AuditActorEnum(actor.value)
        audit_service.record_event(
            case_id=case_id,
            actor=audit_actor,
            action=AuditActionEnum.WORKFLOW_TRANSITIONED,
            metadata={
                "from_state": current_state,
                "to_state": target_state,
                "step_id": step_id,
                "input_summary": {k: v for k, v in (input_data or {}).items() if not str(k).lower().endswith("password")}
            },
            db_session=db_session
        )

        # 6. Check for automatic downstream actions (e.g. provider submission)
        final_state = target_state
        final_case_status = target_def.case_status.value

        if target_state == "provider_submission":
            # Auto-call provider adapter
            provider_resp = provider_adapter.submit_banking_details(
                case_id=case_id,
                client_id=input_data.get("client_id", "unknown") if input_data else "unknown",
                payload=input_data or {}
            )
            audit_service.record_event(
                case_id=case_id,
                actor=AuditActorEnum.SYSTEM,
                action=AuditActionEnum.PROVIDER_SUBMITTED,
                metadata={"provider_response": provider_resp.model_dump(mode="json")},
                db_session=db_session
            )

            if provider_resp.status == "accepted":
                audit_service.record_event(
                    case_id=case_id,
                    actor=AuditActorEnum.PROVIDER,
                    action=AuditActionEnum.PROVIDER_ACCEPTED,
                    metadata={"provider_reference": provider_resp.provider_reference},
                    db_session=db_session
                )
                # Auto-complete provider_submission step and move to completed
                if next_step_obj:
                    next_step_obj.status = StepStatusEnum.COMPLETED
                    next_step_obj.completed_at = datetime.now(timezone.utc)
                    next_step_obj.metadata_json = {"provider_reference": provider_resp.provider_reference}

                completed_step_obj = next((s for s in steps if s.key == "completed"), None)
                if completed_step_obj:
                    completed_step_obj.status = StepStatusEnum.COMPLETED
                    completed_step_obj.completed_at = datetime.now(timezone.utc)
                    next_step_id = completed_step_obj.id

                final_state = "completed"
                final_case_status = CaseStatusEnum.COMPLETED.value
                audit_service.record_event(
                    case_id=case_id,
                    actor=AuditActorEnum.SYSTEM,
                    action=AuditActionEnum.CASE_COMPLETED,
                    metadata={"completed_at": str(now)},
                    db_session=db_session
                )

        return StateTransitionResult(
            success=True,
            previous_state=current_state,
            new_state=final_state,
            case_status=final_case_status,
            completed_step_id=step_id,
            next_step_id=next_step_id,
            message=f"Workflow advanced from '{current_state}' to '{final_state}'.",
        )


workflow_engine = WorkflowEngine()
