import pytest
from app.schemas.enums import CaseTypeEnum, StepOwnerEnum, StepStatusEnum
from app.workflows import (
    get_workflow_definition,
    InvalidTransitionError,
    PreconditionNotMetError,
    UnauthorizedActionError,
)
from app.services.workflow_engine import workflow_engine


def test_banking_workflow_step_initialization():
    initial_id, steps = workflow_engine.initialize_case_steps("case-1", CaseTypeEnum.BANK_DETAILS_CHANGE.value)
    assert len(steps) == 7
    assert steps[0].key == "request_received"
    assert steps[0].status == StepStatusEnum.IN_PROGRESS
    assert steps[1].key == "bank_statement_required"
    assert steps[1].status == StepStatusEnum.PENDING


def test_invalid_step_transition():
    workflow_def = get_workflow_definition(CaseTypeEnum.BANK_DETAILS_CHANGE.value)
    # Attempting to jump directly from request_received to adviser_review should fail
    with pytest.raises(InvalidTransitionError):
        workflow_def.validate_transition(
            current_state="request_received",
            target_state="adviser_review",
            actor=StepOwnerEnum.CLIENT
        )


def test_unauthorized_actor_transition():
    workflow_def = get_workflow_definition(CaseTypeEnum.BANK_DETAILS_CHANGE.value)
    # Client attempting to complete adviser_review should fail
    with pytest.raises(UnauthorizedActionError):
        workflow_def.validate_transition(
            current_state="adviser_review",
            target_state="provider_submission",
            actor=StepOwnerEnum.CLIENT
        )


def test_bank_statement_age_precondition():
    workflow_def = get_workflow_definition(CaseTypeEnum.BANK_DETAILS_CHANGE.value)
    # Bank statement older than 90 days must be rejected
    with pytest.raises(PreconditionNotMetError) as exc_info:
        workflow_def.validate_step_preconditions(
            step_key="bank_statement_validation",
            actor=StepOwnerEnum.SYSTEM,
            input_data={"statement_age_days": 110, "is_valid": True}
        )
    assert "exceeds the 90-day compliance requirement" in str(exc_info.value)
