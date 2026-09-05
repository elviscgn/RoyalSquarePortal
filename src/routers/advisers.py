from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database.config import get_db
from src.database.models import Adviser, Case, Client, ComplianceState, AuditEvent
from src.schemas.entities import AdviserResponse, CaseResponse

router = APIRouter(prefix="/api/advisers", tags=["Advisers & Dashboard"])


@router.get("", response_model=List[AdviserResponse])
def list_advisers(db: Session = Depends(get_db)):
    """List all financial advisers."""
    return db.query(Adviser).all()


@router.get("/{adviser_id}", response_model=AdviserResponse)
def get_adviser(adviser_id: int, db: Session = Depends(get_db)):
    """Get single adviser record."""
    adviser = db.query(Adviser).filter(Adviser.id == adviser_id).first()
    if not adviser:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Adviser {adviser_id} not found")
    return adviser


@router.get("/{adviser_id}/dashboard", response_model=Dict[str, Any])
def get_adviser_dashboard(adviser_id: int, db: Session = Depends(get_db)):
    """Return comprehensive triage and aggregations for the adviser dashboard:
    - needs attention (cases where status is adviser_review or priority is urgent)
    - waiting on client
    - waiting on provider
    - compliance exceptions (clients with incomplete compliance booleans)
    - reviews this week (annual review cases scheduled/due)
    - priority cases
    - recent activity (latest audit events)
    """
    adviser = db.query(Adviser).filter(Adviser.id == adviser_id).first()
    if not adviser:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Adviser {adviser_id} not found")

    cases = db.query(Case).filter(Case.adviser_id == adviser_id).all()

    # Aggregations
    needs_attention_cases = [
        c.to_dict() for c in cases if c.status in ["adviser_review", "open"] or c.priority == "urgent"
    ]
    waiting_on_client_cases = [
        c.to_dict() for c in cases if "client" in (c.current_step or "") or c.status == "waiting_on_client"
    ]
    waiting_on_provider_cases = [
        c.to_dict() for c in cases if c.status == "waiting on provider" or "provider" in (c.current_step or "")
    ]
    priority_cases = [
        c.to_dict() for c in cases if c.priority in ["urgent", "high"] and c.status != "completed"
    ]
    reviews_cases = [
        c.to_dict() for c in cases if c.case_type.value == "annual_review" and c.status != "completed"
    ]

    # Compliance exceptions (clients of this adviser where any compliance boolean is False)
    clients = db.query(Client).filter(Client.adviser_id == adviser_id).all()
    compliance_exceptions = []
    for cl in clients:
        comp = cl.compliance_state
        if comp and not all([
            comp.identity_verified,
            comp.consent_valid,
            comp.pep_screening_clear,
            comp.documents_complete,
            comp.instruction_recorded,
            comp.disclosure_delivered,
            comp.audit_trail_ready,
        ]):
            compliance_exceptions.append({
                "client_id": cl.id,
                "client_name": cl.name,
                "documents_complete": comp.documents_complete,
                "reason": "Missing required evidence (witness details)" if not comp.documents_complete else "Compliance flag pending",
            })

    # Recent activity from audit events for adviser's cases
    case_ids = [c.id for c in cases]
    recent_events = (
        db.query(AuditEvent)
        .filter(AuditEvent.case_id.in_(case_ids))
        .order_by(AuditEvent.timestamp.desc())
        .limit(10)
        .all()
    )

    return {
        "adviser": adviser.to_dict(),
        "summary_counts": {
            "total_clients": len(clients),
            "total_active_cases": len([c for c in cases if c.status != "completed"]),
            "needs_attention": len(needs_attention_cases),
            "waiting_on_client": len(waiting_on_client_cases),
            "waiting_on_provider": len(waiting_on_provider_cases),
            "compliance_exceptions": len(compliance_exceptions),
        },
        "needs_attention": needs_attention_cases,
        "waiting_on_client": waiting_on_client_cases,
        "waiting_on_provider": waiting_on_provider_cases,
        "compliance_exceptions": compliance_exceptions,
        "reviews_this_week": reviews_cases,
        "priority_cases": priority_cases,
        "recent_activity": [e.to_dict() for e in recent_events],
    }
