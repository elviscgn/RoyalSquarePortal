import pytest
from app.schemas.enums import (
    CaseTypeEnum,
    CaseStatusEnum,
    PriorityEnum,
    StepOwnerEnum,
    AuditActionEnum,
)
from app.schemas.case import CaseCreate
from app.schemas.workflow import StepCompleteRequest
from app.services.case_service import case_service
from app.services.audit_service import audit_service
from app.workflows.base import PreconditionNotMetError


def test_banking_details_change_complete_flow():
    """Tests the full P0 Banking Details Change flow from client creation to provider acceptance."""
    # 1. Client creates case
    case_in = CaseCreate(
        client_id="cli-001",
        adviser_id="adv-001",
        case_type=CaseTypeEnum.BANK_DETAILS_CHANGE,
        priority=PriorityEnum.HIGH,
    )
    case = case_service.create_case(case_in)

    assert case.id.startswith("case-")
    # request_received was auto-advanced, so current_state is bank_statement_required
    assert case.current_state == "bank_statement_required"
    assert case.status == CaseStatusEnum.PENDING_CLIENT
    assert case.action_required_from == "client"

    # 2. Client uploads bank statement -> advances to bank_statement_validation
    step_req = StepCompleteRequest(
        actor=StepOwnerEnum.CLIENT,
        input_data={"evidence_id": "evi-991", "file_name": "bank_statement_jan.pdf"}
    )
    res = case_service.complete_step(case.id, "bank_statement_required", step_req)
    assert res.success is True
    assert res.new_state == "bank_statement_validation"

    # 3. Validation step: Test rejection on old statement (> 90 days)
    invalid_validation_req = StepCompleteRequest(
        actor=StepOwnerEnum.SYSTEM,
        input_data={"statement_age_days": 105, "is_valid": True}
    )
    with pytest.raises(PreconditionNotMetError):
        case_service.complete_step(case.id, "bank_statement_validation", invalid_validation_req)

    # 4. Validation step: Valid statement (17 days old) -> advances to bank_instruction_form
    valid_validation_req = StepCompleteRequest(
        actor=StepOwnerEnum.SYSTEM,
        input_data={
            "statement_age_days": 17,
            "is_valid": True,
            "bank": "Standard Bank",
            "account_number": "1019283746",
            "account_holder": "Naledi Mokoena"
        }
    )
    res2 = case_service.complete_step(case.id, "bank_statement_validation", valid_validation_req)
    assert res2.success is True
    assert res2.new_state == "bank_instruction_form"

    # 5. Form step: Attempting to complete without signature should fail
    unsigned_form_req = StepCompleteRequest(
        actor=StepOwnerEnum.CLIENT,
        input_data={"signed": False}
    )
    with pytest.raises(PreconditionNotMetError):
        case_service.complete_step(case.id, "bank_instruction_form", unsigned_form_req)

    # 6. Form step: Client signs and submits -> advances to adviser_review
    signed_form_req = StepCompleteRequest(
        actor=StepOwnerEnum.CLIENT,
        input_data={
            "signed": True,
            "signature_timestamp": "2026-09-05T14:30:00Z",
            "confirmed_account_number": "1019283746"
        }
    )
    res3 = case_service.complete_step(case.id, "bank_instruction_form", signed_form_req)
    assert res3.success is True
    assert res3.new_state == "adviser_review"

    # Verify case state is now waiting for adviser exception review
    updated_case = case_service.get_case(case.id)
    assert updated_case.status == CaseStatusEnum.PENDING_ADVISER
    assert updated_case.action_required_from == "adviser"

    # 7. Adviser approves the exception -> triggers provider submission and auto-completes case!
    approval_req = StepCompleteRequest(
        actor=StepOwnerEnum.ADVISER,
        actor_id="adv-001",
        input_data={
            "approved": True,
            "decision": "approved",
            "comment": "Bank statement verified against identity. Approved for submission.",
            "client_id": "cli-001",
            "account_number": "1019283746",
        }
    )
    res4 = case_service.complete_step(case.id, "adviser_review", approval_req)
    assert res4.success is True
    assert res4.new_state == "completed"
    assert res4.case_status == CaseStatusEnum.COMPLETED.value

    # 8. Verify final case status and audit trail
    final_case = case_service.get_case(case.id)
    assert final_case.status == CaseStatusEnum.COMPLETED
    assert final_case.provider_status == "accepted"

    timeline = audit_service.get_case_timeline(case.id)
    assert timeline.total_events >= 5
    actions = [e.action for e in timeline.events]
    assert AuditActionEnum.CASE_CREATED in actions
    assert AuditActionEnum.WORKFLOW_STARTED in actions
    assert AuditActionEnum.WORKFLOW_TRANSITIONED in actions
    assert AuditActionEnum.PROVIDER_SUBMITTED in actions
    assert AuditActionEnum.PROVIDER_ACCEPTED in actions
    assert AuditActionEnum.CASE_COMPLETED in actions
