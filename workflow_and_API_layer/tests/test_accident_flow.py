import pytest
from app.schemas.enums import (
    CaseTypeEnum,
    CaseStatusEnum,
    PriorityEnum,
    StepOwnerEnum,
)
from app.schemas.case import CaseCreate
from app.schemas.workflow import StepCompleteRequest
from app.services.case_service import case_service


def test_motor_accident_flow():
    """Tests the P1 Motor Accident Claim workflow progression."""
    # 1. Create Accident Case (e.g. from offline sync or client report)
    case_in = CaseCreate(
        client_id="cli-002",
        adviser_id="adv-001",
        case_type=CaseTypeEnum.MOTOR_ACCIDENT,
        priority=PriorityEnum.URGENT,
        metadata_json={
            "gps_latitude": -26.2041,
            "gps_longitude": 28.0473,
            "gps_accuracy": "±8m",
            "vehicle_plate": "CA 123-456",
            "voice_statement_recorded": True,
        }
    )
    case = case_service.create_case(case_in)
    assert case.case_type == CaseTypeEnum.MOTOR_ACCIDENT
    assert case.priority == PriorityEnum.URGENT
    assert case.current_state == "incident_captured"

    # 2. Advance incident_captured -> evidence_collection
    res1 = case_service.complete_step(
        case.id,
        "incident_captured",
        StepCompleteRequest(actor=StepOwnerEnum.CLIENT)
    )
    assert res1.new_state == "evidence_collection"

    # 3. Complete evidence collection -> client_submission
    res2 = case_service.complete_step(
        case.id,
        "evidence_collection",
        StepCompleteRequest(
            actor=StepOwnerEnum.CLIENT,
            input_data={"photos_count": 4, "witness_details": "None"}
        )
    )
    assert res2.new_state == "client_submission"

    # 4. Client submits report -> adviser_review
    res3 = case_service.complete_step(
        case.id,
        "client_submission",
        StepCompleteRequest(actor=StepOwnerEnum.CLIENT)
    )
    assert res3.new_state == "adviser_review"
    assert res3.case_status == CaseStatusEnum.PENDING_ADVISER.value

    # 5. Adviser approves -> claim_registration
    res4 = case_service.complete_step(
        case.id,
        "adviser_review",
        StepCompleteRequest(
            actor=StepOwnerEnum.ADVISER,
            input_data={"approved": True, "insurer": "Discovery Insure"}
        )
    )
    assert res4.new_state == "claim_registration"
