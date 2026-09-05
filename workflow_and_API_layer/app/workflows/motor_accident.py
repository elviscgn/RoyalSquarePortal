from typing import List, Dict, Any, Optional
from app.schemas.enums import CaseTypeEnum, StepOwnerEnum, CaseStatusEnum
from app.workflows.base import (
    BaseWorkflowDefinition,
    StepDefinition,
    PreconditionNotMetError,
)


class MotorAccidentWorkflow(BaseWorkflowDefinition):
    case_type = CaseTypeEnum.MOTOR_ACCIDENT.value
    initial_state = "incident_captured"

    steps: List[StepDefinition] = [
        StepDefinition(
            key="incident_captured",
            title="Accident Incident Logged",
            owner=StepOwnerEnum.CLIENT,
            order=1,
            case_status=CaseStatusEnum.IN_PROGRESS,
            next_state="evidence_collection",
            permitted_actors={StepOwnerEnum.CLIENT, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="evidence_collection",
            title="Capture Photos & Evidence",
            owner=StepOwnerEnum.CLIENT,
            order=2,
            case_status=CaseStatusEnum.PENDING_CLIENT,
            required_evidence="scene_photos",
            next_state="client_submission",
            permitted_actors={StepOwnerEnum.CLIENT, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="client_submission",
            title="Submit Claim for Adviser Triage",
            owner=StepOwnerEnum.CLIENT,
            order=3,
            case_status=CaseStatusEnum.PENDING_CLIENT,
            next_state="adviser_review",
            permitted_actors={StepOwnerEnum.CLIENT, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="adviser_review",
            title="Adviser Claim Triage & Review",
            owner=StepOwnerEnum.ADVISER,
            order=4,
            case_status=CaseStatusEnum.PENDING_ADVISER,
            next_state="claim_registration",
            permitted_actors={StepOwnerEnum.ADVISER, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="claim_registration",
            title="Register Claim with Insurer",
            owner=StepOwnerEnum.SYSTEM,
            order=5,
            case_status=CaseStatusEnum.PENDING_PROVIDER,
            next_state="claim_number_received",
            permitted_actors={StepOwnerEnum.SYSTEM, StepOwnerEnum.PROVIDER},
        ),
        StepDefinition(
            key="claim_number_received",
            title="Claim Number Assigned",
            owner=StepOwnerEnum.PROVIDER,
            order=6,
            case_status=CaseStatusEnum.IN_PROGRESS,
            next_state="assessment",
            permitted_actors={StepOwnerEnum.PROVIDER, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="assessment",
            title="Vehicle Damage Assessment",
            owner=StepOwnerEnum.PROVIDER,
            order=7,
            case_status=CaseStatusEnum.IN_PROGRESS,
            next_state="quotes",
            permitted_actors={StepOwnerEnum.PROVIDER, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="quotes",
            title="Obtain Repair Quotes",
            owner=StepOwnerEnum.PROVIDER,
            order=8,
            case_status=CaseStatusEnum.IN_PROGRESS,
            next_state="authorisation",
            permitted_actors={StepOwnerEnum.PROVIDER, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="authorisation",
            title="Repair Authorisation",
            owner=StepOwnerEnum.ADVISER,
            order=9,
            case_status=CaseStatusEnum.PENDING_ADVISER,
            next_state="repair",
            permitted_actors={StepOwnerEnum.ADVISER, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="repair",
            title="Vehicle in Repair",
            owner=StepOwnerEnum.PROVIDER,
            order=10,
            case_status=CaseStatusEnum.IN_PROGRESS,
            next_state="collection",
            permitted_actors={StepOwnerEnum.PROVIDER, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="collection",
            title="Vehicle Ready for Collection",
            owner=StepOwnerEnum.CLIENT,
            order=11,
            case_status=CaseStatusEnum.PENDING_CLIENT,
            next_state="completed",
            permitted_actors={StepOwnerEnum.CLIENT, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="completed",
            title="Claim Settled and Closed",
            owner=StepOwnerEnum.SYSTEM,
            order=12,
            case_status=CaseStatusEnum.COMPLETED,
            next_state=None,
            permitted_actors={StepOwnerEnum.SYSTEM},
        ),
    ]

    @classmethod
    def validate_step_preconditions(
        cls,
        step_key: str,
        actor: StepOwnerEnum,
        input_data: Optional[Dict[str, Any]] = None
    ) -> None:
        data = input_data or {}
        if step_key == "adviser_review":
            if not data.get("approved", True) and data.get("decision") == "rejected":
                raise PreconditionNotMetError(
                    "Motor accident claim rejected during adviser review.",
                    details=data
                )
