import pytest
from app.schemas.enums import CaseTypeEnum, PriorityEnum, StepOwnerEnum
from app.schemas.case import CaseCreate
from app.schemas.workflow import StepCompleteRequest
from app.services.case_service import case_service
from app.services.adviser_service import adviser_service


def test_adviser_dashboard_triage_counts():
    """Tests triage queue metrics aggregation for adviser operations."""
    # Create Case 1: Banking details change in bank_statement_required (waiting on client)
    c1 = case_service.create_case(
        CaseCreate(
            client_id="cli-001",
            adviser_id="adv-001",
            case_type=CaseTypeEnum.BANK_DETAILS_CHANGE,
            priority=PriorityEnum.MEDIUM,
        )
    )

    # Create Case 2: Accident in urgent priority and advance to adviser_review
    c2 = case_service.create_case(
        CaseCreate(
            client_id="cli-002",
            adviser_id="adv-001",
            case_type=CaseTypeEnum.MOTOR_ACCIDENT,
            priority=PriorityEnum.URGENT,
        )
    )
    case_service.complete_step(c2.id, "incident_captured", StepCompleteRequest(actor=StepOwnerEnum.CLIENT))
    case_service.complete_step(c2.id, "evidence_collection", StepCompleteRequest(actor=StepOwnerEnum.CLIENT))
    case_service.complete_step(c2.id, "client_submission", StepCompleteRequest(actor=StepOwnerEnum.CLIENT))

    # Query Adviser Dashboard
    dashboard = adviser_service.get_dashboard("adv-001")

    assert dashboard.adviser_id == "adv-001"
    assert dashboard.triage.total_active_cases == 2
    assert dashboard.triage.waiting_on_client >= 1  # Case 1 is in bank_statement_required
    assert dashboard.triage.needs_attention >= 1   # Case 2 is in adviser_review
    assert dashboard.triage.compliance_exceptions >= 1  # Case 1 is banking details change, Case 2 is urgent

    # Verify priority cases list contains urgent / pending adviser cases
    priority_ids = [p.id for p in dashboard.priority_cases]
    assert c2.id in priority_ids

    # Verify recent activity stream is populated
    assert len(dashboard.recent_activity) > 0
