from fastapi import APIRouter, HTTPException, status
from app.schemas.audit import AuditTimelineOut
from app.services.audit_service import audit_service
from app.services.case_service import case_service

router = APIRouter(prefix="/cases", tags=["Audit"])


@router.get("/{case_id}/audit", response_model=AuditTimelineOut)
def get_case_audit_timeline(case_id: str):
    """Retrieves immutable audit event timeline for a given case."""
    case = case_service.get_case(case_id)
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID '{case_id}' not found."
        )
    return audit_service.get_case_timeline(case_id)
