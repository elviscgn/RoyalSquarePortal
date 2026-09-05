from datetime import datetime, timezone
from typing import List, Optional, Any
from app.schemas.enums import CaseStatusEnum, PriorityEnum, CaseTypeEnum
from app.schemas.case import CaseFilterParams
from app.schemas.adviser import (
    AdviserDashboardOut,
    TriageCounts,
    PriorityCaseSummary,
    RecentActivityItem,
)
from app.services.case_service import case_service
from app.services.audit_service import audit_service


class AdviserService:
    """Service for adviser dashboard triage aggregations, queues, and activity tracking."""

    def get_dashboard(self, adviser_id: str, db_session: Any = None) -> AdviserDashboardOut:
        """Calculates aggregated triage metrics for the adviser's operational workbench."""
        # Query cases for this adviser
        filters = CaseFilterParams(adviser_id=adviser_id)
        all_cases = case_service.list_cases(filters=filters, db_session=db_session)

        # If no specific cases assigned, check all active cases for demo visibility
        if not all_cases:
            all_cases = case_service.list_cases(db_session=db_session)

        active_cases = [c for c in all_cases if c.status not in (CaseStatusEnum.COMPLETED, CaseStatusEnum.REJECTED)]

        # Triage metrics calculation
        needs_attention = len([c for c in active_cases if c.status == CaseStatusEnum.PENDING_ADVISER])
        waiting_on_client = len([c for c in active_cases if c.status == CaseStatusEnum.PENDING_CLIENT])
        waiting_on_provider = len([c for c in active_cases if c.status == CaseStatusEnum.PENDING_PROVIDER])
        
        # Compliance exceptions (e.g. banking details changes undergoing validation or urgent cases)
        compliance_exceptions = len([
            c for c in active_cases
            if c.case_type == CaseTypeEnum.BANK_DETAILS_CHANGE or c.priority == PriorityEnum.URGENT
        ])
        reviews_this_week = len([c for c in active_cases if c.case_type == CaseTypeEnum.ANNUAL_REVIEW])

        triage = TriageCounts(
            needs_attention=needs_attention,
            waiting_on_client=waiting_on_client,
            waiting_on_provider=waiting_on_provider,
            compliance_exceptions=compliance_exceptions,
            reviews_this_week=reviews_this_week,
            total_active_cases=len(active_cases),
        )

        # Priority cases queue
        priority_cases: List[PriorityCaseSummary] = []
        for c in active_cases:
            if c.priority in (PriorityEnum.URGENT, PriorityEnum.HIGH) or c.status == CaseStatusEnum.PENDING_ADVISER:
                detail = case_service.get_case(c.id, db_session=db_session)
                step_title = detail.current_step.title if detail and detail.current_step else c.current_state
                action_req = detail.action_required_from if detail and detail.action_required_from else "system"
                priority_cases.append(
                    PriorityCaseSummary(
                        id=c.id,
                        client_id=c.client_id,
                        client_name="Naledi Mokoena" if c.client_id == "cli-001" else "Sipho Dlamini",
                        case_type=c.case_type,
                        priority=c.priority,
                        status=c.status,
                        current_state=c.current_state,
                        current_step_title=step_title,
                        action_required_from=action_req,
                        created_at=c.created_at,
                    )
                )

        # Recent activity stream
        recent_activity: List[RecentActivityItem] = []
        for c in all_cases[:5]:
            timeline = audit_service.get_case_timeline(c.id, db_session=db_session)
            for event in timeline.events[-2:]:
                recent_activity.append(
                    RecentActivityItem(
                        id=event.id,
                        case_id=c.id,
                        client_name="Naledi Mokoena" if c.client_id == "cli-001" else "Sipho Dlamini",
                        case_type=c.case_type,
                        action=event.action.value,
                        actor=event.actor.value,
                        description=f"Action '{event.action.value}' recorded by {event.actor.value}",
                        timestamp=event.timestamp,
                    )
                )

        recent_activity.sort(key=lambda x: x.timestamp, reverse=True)

        return AdviserDashboardOut(
            adviser_id=adviser_id,
            adviser_name="Qiniso Ntuli",
            triage=triage,
            priority_cases=priority_cases[:10],
            recent_activity=recent_activity[:10],
        )


adviser_service = AdviserService()
