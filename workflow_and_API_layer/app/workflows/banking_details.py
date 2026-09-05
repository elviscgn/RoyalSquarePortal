from typing import List, Dict, Any, Optional
from app.schemas.enums import CaseTypeEnum, StepOwnerEnum, CaseStatusEnum
from app.workflows.base import (
    BaseWorkflowDefinition,
    StepDefinition,
    InvalidTransitionError,
    PreconditionNotMetError,
    UnauthorizedActionError,
)


class BankingDetailsWorkflow(BaseWorkflowDefinition):
    case_type = CaseTypeEnum.BANK_DETAILS_CHANGE.value
    initial_state = "request_received"

    steps: List[StepDefinition] = [
        StepDefinition(
            key="request_received",
            title="Change Request Initiated",
            owner=StepOwnerEnum.SYSTEM,
            order=1,
            case_status=CaseStatusEnum.IN_PROGRESS,
            is_auto_advance=True,
            next_state="bank_statement_required",
            permitted_actors={StepOwnerEnum.SYSTEM, StepOwnerEnum.CLIENT},
        ),
        StepDefinition(
            key="bank_statement_required",
            title="Bank Statement Upload Required",
            owner=StepOwnerEnum.CLIENT,
            order=2,
            case_status=CaseStatusEnum.PENDING_CLIENT,
            required_evidence="bank_statement",
            next_state="bank_statement_validation",
            permitted_actors={StepOwnerEnum.CLIENT, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="bank_statement_validation",
            title="Bank Statement Verification",
            owner=StepOwnerEnum.SYSTEM,
            order=3,
            case_status=CaseStatusEnum.IN_PROGRESS,
            next_state="bank_instruction_form",
            permitted_actors={StepOwnerEnum.SYSTEM, StepOwnerEnum.CLIENT},
        ),
        StepDefinition(
            key="bank_instruction_form",
            title="Complete & Sign Banking Instruction",
            owner=StepOwnerEnum.CLIENT,
            order=4,
            case_status=CaseStatusEnum.PENDING_CLIENT,
            next_state="adviser_review",
            permitted_actors={StepOwnerEnum.CLIENT, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="adviser_review",
            title="Adviser Exception & Approval Review",
            owner=StepOwnerEnum.ADVISER,
            order=5,
            case_status=CaseStatusEnum.PENDING_ADVISER,
            next_state="provider_submission",
            permitted_actors={StepOwnerEnum.ADVISER, StepOwnerEnum.SYSTEM},
        ),
        StepDefinition(
            key="provider_submission",
            title="Provider Gateway Transmission",
            owner=StepOwnerEnum.SYSTEM,
            order=6,
            case_status=CaseStatusEnum.PENDING_PROVIDER,
            next_state="completed",
            permitted_actors={StepOwnerEnum.SYSTEM, StepOwnerEnum.PROVIDER},
        ),
        StepDefinition(
            key="completed",
            title="Banking Details Updated",
            owner=StepOwnerEnum.SYSTEM,
            order=7,
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
        """Validates domain-specific business rules before a step can be completed."""
        data = input_data or {}

        if step_key == "bank_statement_validation":
            # Business rule: Bank statement must be less than 3 months old (<= 90 days)
            age_days = data.get("statement_age_days")
            if age_days is not None and age_days > 90:
                raise PreconditionNotMetError(
                    f"Bank statement is invalid: statement age ({age_days} days) exceeds the 90-day compliance requirement.",
                    details={"statement_age_days": age_days, "max_allowed_days": 90}
                )
            if data.get("is_valid") is False:
                raise PreconditionNotMetError(
                    "Bank statement validation failed: extracted details do not match client account.",
                    details=data
                )

        elif step_key == "bank_instruction_form":
            # Business rule: Must have signature confirmation
            if not data.get("signed", False) and not data.get("signature_present", False):
                raise PreconditionNotMetError(
                    "Cannot complete banking instruction form: digital signature or explicit confirmation is required.",
                    details={"signed": False}
                )

        elif step_key == "adviser_review":
            # Business rule: Adviser approval action
            decision = data.get("decision", "approved")
            if decision == "rejected":
                raise PreconditionNotMetError(
                    "Case rejected by adviser during exception review.",
                    details={"decision": "rejected", "reason": data.get("reason", "Not specified")}
                )
            if decision != "approved" and not data.get("approved", False):
                raise PreconditionNotMetError(
                    "Adviser approval is required to proceed to provider submission.",
                    details=data
                )
