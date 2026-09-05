from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database.config import get_db
from src.database.models import Case, WorkflowStep, AuditEvent
from src.schemas.entities import (
    CaseResponse,
    CaseDetailResponse,
    CaseCreate,
    WorkflowStepResponse,
)

router = APIRouter(prefix="/api", tags=["Cases & Workflows"])


@router.post("/cases", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    """Create a new case and initialize its primary audit trail."""
    new_case = Case(
        client_id=payload.client_id,
        adviser_id=payload.adviser_id,
        case_type=payload.case_type,
        status=payload.status,
        priority=payload.priority,
        current_step=payload.current_step,
    )
    db.add(new_case)
    db.flush()

    # Record initial audit event
    audit = AuditEvent(
        actor="system",
        action="case.created",
        case_id=new_case.id,
        metadata={"case_type": new_case.case_type.value, "initial_status": new_case.status},
    )
    db.add(audit)
    db.commit()
    db.refresh(new_case)
    return new_case


@router.get("/cases/{case_id}", response_model=CaseDetailResponse)
def get_case(case_id: int, db: Session = Depends(get_db)):
    """Retrieve full details of a case including steps, evidence, forms, and audit timeline."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")
    return case


@router.get("/clients/{client_id}/cases", response_model=List[CaseResponse])
def get_client_cases(client_id: int, db: Session = Depends(get_db)):
    """List all cases associated with a given client."""
    return db.query(Case).filter(Case.client_id == client_id).all()


@router.get("/advisers/{adviser_id}/cases", response_model=List[CaseResponse])
def get_adviser_cases(adviser_id: int, db: Session = Depends(get_db)):
    """List all cases assigned to a given adviser."""
    return db.query(Case).filter(Case.adviser_id == adviser_id).all()


@router.post("/cases/{case_id}/steps/{step_id}/complete", response_model=CaseDetailResponse)
def complete_workflow_step(case_id: int, step_id: int, actor: Optional[str] = "adviser", db: Session = Depends(get_db)):
    """Complete a workflow step, record audit event, and advance the case's current_step."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")

    step = db.query(WorkflowStep).filter(WorkflowStep.id == step_id, WorkflowStep.case_id == case_id).first()
    if not step:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"WorkflowStep {step_id} not found on case {case_id}")

    now = datetime.now(timezone.utc)
    step.status = "completed"
    step.completion_timestamp = now

    # Find the next pending step by order
    next_step = (
        db.query(WorkflowStep)
        .filter(WorkflowStep.case_id == case_id, WorkflowStep.order > step.order)
        .order_by(WorkflowStep.order.asc())
        .first()
    )

    if next_step:
        next_step.status = "in_progress"
        case.current_step = next_step.key
        if next_step.owner.value == "provider":
            case.status = "waiting on provider"
    else:
        case.status = "completed"
        case.current_step = "completed"

    case.updated_at = now

    # Record audit event
    db.add(
        AuditEvent(
            actor=actor or "system",
            action="workflow.step_completed",
            case_id=case.id,
            metadata={
                "completed_step": step.key,
                "completed_title": step.title,
                "next_step": case.current_step,
                "case_status": case.status,
            },
        )
    )

    db.commit()
    db.refresh(case)
    return case
