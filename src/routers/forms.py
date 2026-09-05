from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from src.database.config import get_db
from src.database.models import (
    FormDefinition,
    FormSubmission,
    Case,
    Client,
    Evidence,
    AuditEvent,
)
from src.database.enums import EvidenceType
from src.schemas.entities import (
    FormDefinitionResponse,
    FormSubmissionResponse,
    FormSubmissionCreate,
)

router = APIRouter(prefix="/api", tags=["Forms & Submissions"])


class FormSubmissionUpdate(BaseModel):
    answers: Optional[Dict[str, Any]] = None
    signature: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


@router.get("/forms/{form_key}", response_model=FormDefinitionResponse)
def get_form_definition(form_key: str, db: Session = Depends(get_db)):
    """Retrieve form schema, fields, and validation rules."""
    form_def = db.query(FormDefinition).filter(FormDefinition.id == form_key).first()
    if not form_def:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Form '{form_key}' not found")
    return form_def


@router.get("/cases/{case_id}/forms/banking-instruction/prefill")
def get_banking_instruction_prefill(case_id: int, db: Session = Depends(get_db)):
    """Pre-fills banking instruction form with verified client profile data plus extracted bank statement data."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")

    client = db.query(Client).filter(Client.id == case.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Client for case {case_id} not found")

    # Find validated bank statement evidence for this case
    bank_evidence = (
        db.query(Evidence)
        .filter(
            Evidence.case_id == case_id,
            Evidence.type == EvidenceType.BANK_STATEMENT,
            Evidence.validation_state == "valid",
        )
        .order_by(Evidence.timestamp.desc())
        .first()
    )

    extracted = bank_evidence.extracted_data if bank_evidence else {}

    return {
        "case_id": case.id,
        "client_id": client.id,
        "client_name": client.name,
        "id_number": client.id_number,
        "address": client.address,
        "mobile": client.mobile,
        "email": client.email,
        # Extracted bank statement data
        "bank": extracted.get("bank_name", "Standard Bank South Africa"),
        "account_holder": extracted.get("account_holder", client.name),
        "account_number": extracted.get("account_number", ""),
        "branch_code": extracted.get("branch_code", ""),
        "account_type": extracted.get("account_type", "Cheque"),
        "statement_date": extracted.get("statement_date", ""),
        "statement_age_days": extracted.get("statement_age_days", 0),
        "evidence_id": bank_evidence.id if bank_evidence else None,
    }


@router.post("/forms/{form_key}/submissions", response_model=FormSubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(form_key: str, payload: FormSubmissionCreate, db: Session = Depends(get_db)):
    """Initialize a form submission for a client case."""
    submission = FormSubmission(
        client_id=payload.client_id,
        case_id=payload.case_id,
        form_version=payload.form_version,
        answers=payload.answers,
        signature=payload.signature,
        status=payload.status,
        generated_document=payload.generated_document,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.patch("/form-submissions/{submission_id}", response_model=FormSubmissionResponse)
def update_submission(submission_id: int, payload: FormSubmissionUpdate, db: Session = Depends(get_db)):
    """Save draft answers or attach signature to a form submission."""
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Submission {submission_id} not found")

    if payload.answers is not None:
        submission.answers = payload.answers
    if payload.signature is not None:
        submission.signature = payload.signature
    if payload.status is not None:
        submission.status = payload.status

    db.commit()
    db.refresh(submission)
    return submission


@router.post("/form-submissions/{submission_id}/submit", response_model=FormSubmissionResponse)
def finalize_submission(submission_id: int, db: Session = Depends(get_db)):
    """Finalize submission, record client signature audit event, and mark ready for review."""
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Submission {submission_id} not found")

    submission.status = "submitted"
    submission.submitted_timestamp = datetime.now(timezone.utc)

    # Record audit events
    db.add(
        AuditEvent(
            actor=f"client:{submission.client_id}",
            action="client.signed",
            case_id=submission.case_id,
            metadata={"submission_id": submission.id, "form_version": submission.form_version},
        )
    )
    db.add(
        AuditEvent(
            actor=f"client:{submission.client_id}",
            action="form.submitted",
            case_id=submission.case_id,
            metadata={"submission_id": submission.id},
        )
    )

    db.commit()
    db.refresh(submission)
    return submission
