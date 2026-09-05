from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.schemas.adviser import AdviserDashboardOut
from app.schemas.case import CaseOut, CaseFilterParams, CaseStatusEnum, PriorityEnum
from app.services.adviser_service import adviser_service
from app.services.case_service import case_service

router = APIRouter(prefix="/advisers", tags=["Advisers"])


@router.get("/{adviser_id}/dashboard", response_model=AdviserDashboardOut)
def get_adviser_dashboard(adviser_id: str):
    """Retrieves aggregated triage queues, priority cases, and recent activity for the adviser."""
    return adviser_service.get_dashboard(adviser_id)


@router.get("/{adviser_id}/cases", response_model=List[CaseOut])
def get_adviser_cases(
    adviser_id: str,
    status: Optional[CaseStatusEnum] = Query(None),
    priority: Optional[PriorityEnum] = Query(None),
):
    """Retrieves all cases assigned to the specified adviser with optional filtering."""
    filters = CaseFilterParams(
        adviser_id=adviser_id,
        status=status,
        priority=priority,
    )
    return case_service.list_cases(filters)
