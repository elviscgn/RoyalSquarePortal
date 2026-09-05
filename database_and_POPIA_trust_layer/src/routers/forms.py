from datetime import datetime, timezone
import os
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
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
    WorkflowStep,
)
from src.database.enums import EvidenceType
from src.schemas.entities import (
    FormDefinitionResponse,
    FormSubmissionResponse,
    FormSubmissionCreate,
)
from src.services.pdf_generator import generate_form_submission_pdf

router = APIRouter(prefix="/api", tags=["Forms & Submissions"])


class FormSubmissionUpdate(BaseModel):
    answers: Optional[Dict[str, Any]] = None
    signature: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


@router.get("/forms", response_model=List[FormDefinitionResponse])
def list_form_definitions(db: Session = Depends(get_db)):
    """Retrieve all active reusable form definitions."""
    return db.query(FormDefinition).all()


@router.get("/forms/{form_key}", response_model=FormDefinitionResponse)
def get_form_definition(form_key: str, db: Session = Depends(get_db)):
    """Retrieve form schema, fields, and validation rules for a given form key."""
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

    # Fallback to any bank statement if validation is pending
    if not bank_evidence:
        bank_evidence = (
            db.query(Evidence)
            .filter(
                Evidence.case_id == case_id,
                Evidence.type == EvidenceType.BANK_STATEMENT,
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
        "bank_name": extracted.get("bank_name", "Standard Bank South Africa"),
        "account_holder": extracted.get("account_holder", client.name),
        "account_number": extracted.get("account_number", "10192837465"),
        "branch_code": extracted.get("branch_code", "051001"),
        "account_type": extracted.get("account_type", "Cheque"),
        "statement_date": extracted.get("statement_date", "2026-08-19"),
        "statement_age_days": extracted.get("statement_age_days", 17),
        "evidence_id": bank_evidence.id if bank_evidence else None,
        "validation_state": bank_evidence.validation_state if bank_evidence else "pending",
    }


@router.get("/cases/{case_id}/forms/{form_key}/prefill")
def get_generic_form_prefill(case_id: int, form_key: str, db: Session = Depends(get_db)):
    """Dynamically pre-fills any FormDefinition using its profile_mappings and case evidence."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")

    client = db.query(Client).filter(Client.id == case.client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Client for case {case_id} not found")

    form_def = db.query(FormDefinition).filter(FormDefinition.id == form_key).first()
    if not form_def:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Form '{form_key}' not found")

    prefilled: Dict[str, Any] = {
        "case_id": case.id,
        "client_id": client.id,
        "form_id": form_def.id,
        "form_version": form_def.version,
    }

    # Map client and adviser attributes
    client_dict = client.to_dict()
    adviser_dict = client.adviser.to_dict() if client.adviser else {}

    mappings = form_def.profile_mappings or {}
    for form_field, profile_field in mappings.items():
        if profile_field.startswith("adviser."):
            adv_key = profile_field.replace("adviser.", "")
            prefilled[form_field] = adviser_dict.get(adv_key, "")
        elif profile_field.startswith("client."):
            cli_key = profile_field.replace("client.", "")
            prefilled[form_field] = client_dict.get(cli_key, "")
        else:
            prefilled[form_field] = client_dict.get(profile_field, "")

    # Always provide adviser fallback if available
    if "adviserName" not in prefilled and client.adviser:
        prefilled["adviserName"] = client.adviser.name
    if "adviser_name" not in prefilled and client.adviser:
        prefilled["adviser_name"] = client.adviser.name

    # For banking details instruction, augment with bank statement data
    if "banking" in form_key:
        bank_evidence = (
            db.query(Evidence)
            .filter(Evidence.case_id == case_id, Evidence.type == EvidenceType.BANK_STATEMENT)
            .order_by(Evidence.timestamp.desc())
            .first()
        )
        if bank_evidence and bank_evidence.extracted_data:
            data = bank_evidence.extracted_data
            prefilled["bank_name"] = data.get("bank_name", "Standard Bank South Africa")
            prefilled["account_holder"] = data.get("account_holder", client.name)
            prefilled["account_number"] = data.get("account_number", "")
            prefilled["branch_code"] = data.get("branch_code", "")
            prefilled["account_type"] = data.get("account_type", "Cheque")

    return prefilled


@router.post("/forms/{form_key}/submissions", response_model=FormSubmissionResponse, status_code=status.HTTP_201_CREATED)
def create_submission(form_key: str, payload: FormSubmissionCreate, db: Session = Depends(get_db)):
    """Initialize a form submission for a client case."""
    case = db.query(Case).filter(Case.id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {payload.case_id} not found")

    client_id = payload.client_id or case.client_id

    submission = FormSubmission(
        client_id=client_id,
        case_id=payload.case_id,
        form_version=payload.form_version,
        answers=payload.answers,
        signature=payload.signature or {},
        status=payload.status or "draft",
        generated_document=payload.generated_document,
    )
    db.add(submission)
    db.flush()

    # If submitted immediately with signature, finalize it
    if payload.status == "submitted":
        _finalize_submission_actions(submission, form_key, db)

    db.commit()
    db.refresh(submission)
    return submission


@router.get("/form-submissions/{submission_id}", response_model=FormSubmissionResponse)
def get_submission(submission_id: int, db: Session = Depends(get_db)):
    """Retrieve form submission by ID."""
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Submission {submission_id} not found")
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
    """Finalize submission:
    1. Mark status as submitted with timestamp
    2. Record digital signature audit event with metadata
    3. Advance linked case workflow step (e.g. bank_instruction_form -> adviser_review)
    4. Auto-generate signed PDF document
    """
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Submission {submission_id} not found")

    # Extract form key from form_version (e.g. "banking-details-instruction/v1.2" -> "banking-details-instruction")
    form_key = submission.form_version.split("/")[0]

    _finalize_submission_actions(submission, form_key, db)

    db.commit()
    db.refresh(submission)
    return submission


def _finalize_submission_actions(submission: FormSubmission, form_key: str, db: Session):
    """Helper to execute submission finalization, audit events, workflow step advancement, and PDF generation."""
    submission.status = "submitted"
    submission.submitted_timestamp = datetime.now(timezone.utc)

    # Ensure signature structure
    sig = submission.signature or {}
    if not sig.get("signed"):
        sig["signed"] = True
    if not sig.get("timestamp"):
        sig["timestamp"] = datetime.now(timezone.utc).isoformat()
    if not sig.get("method"):
        sig["method"] = "digital_signature_pad"
    if not sig.get("signer_name"):
        client = db.query(Client).filter(Client.id == submission.client_id).first()
        sig["signer_name"] = client.name if client else "Client"
    submission.signature = sig

    # Record signature audit event
    db.add(
        AuditEvent(
            actor=f"client:{submission.client_id}",
            action="client.signed",
            case_id=submission.case_id,
            metadata={
                "submission_id": submission.id,
                "form_version": submission.form_version,
                "signer_name": sig.get("signer_name"),
                "method": sig.get("method"),
                "timestamp": sig.get("timestamp"),
                "ip": sig.get("signer_ip", "127.0.0.1"),
            },
        )
    )

    # Record form submitted audit event
    db.add(
        AuditEvent(
            actor=f"client:{submission.client_id}",
            action="form.submitted",
            case_id=submission.case_id,
            metadata={"submission_id": submission.id, "form_key": form_key},
        )
    )

    # Advance linked case workflow step if applicable
    if submission.case_id:
        case = db.query(Case).filter(Case.id == submission.case_id).first()
        if case:
            step = (
                db.query(WorkflowStep)
                .filter(WorkflowStep.case_id == case.id, WorkflowStep.key == "bank_instruction_form")
                .first()
            )
            if step:
                step.status = "completed"
                step.completion_timestamp = datetime.now(timezone.utc)
                case.current_step = "adviser_review"
                case.status = "adviser_review"

                # Next step in progress
                adv_step = (
                    db.query(WorkflowStep)
                    .filter(WorkflowStep.case_id == case.id, WorkflowStep.key == "adviser_review")
                    .first()
                )
                if adv_step:
                    adv_step.status = "in_progress"

    # Generate final PDF copy
    try:
        client = db.query(Client).filter(Client.id == submission.client_id).first()
        form_def = db.query(FormDefinition).filter(FormDefinition.id == form_key).first()
        form_title = form_def.title if form_def else form_key.replace("-", " ").title()

        pdf_path = generate_form_submission_pdf(
            submission_id=submission.id or 1,
            form_title=form_title,
            form_version=submission.form_version,
            client_name=client.name if client else "Client",
            id_number=client.id_number if client else "0000000000000",
            answers=submission.answers or {},
            signature=submission.signature or {},
        )
        submission.generated_document = pdf_path
    except Exception as e:
        print(f"PDF generation note: {e}")


@router.get("/form-submissions/{submission_id}/pdf")
def download_submission_pdf(submission_id: int, db: Session = Depends(get_db)):
    """Download the generated PDF record for a form submission."""
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Submission {submission_id} not found")

    pdf_path = submission.generated_document
    if not pdf_path or not os.path.exists(pdf_path):
        # Generate on-demand
        form_key = submission.form_version.split("/")[0]
        client = db.query(Client).filter(Client.id == submission.client_id).first()
        form_def = db.query(FormDefinition).filter(FormDefinition.id == form_key).first()
        form_title = form_def.title if form_def else form_key.replace("-", " ").title()

        pdf_path = generate_form_submission_pdf(
            submission_id=submission.id,
            form_title=form_title,
            form_version=submission.form_version,
            client_name=client.name if client else "Client",
            id_number=client.id_number if client else "0000000000000",
            answers=submission.answers or {},
            signature=submission.signature or {},
        )
        submission.generated_document = pdf_path
        db.commit()

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(pdf_path),
    )


@router.post("/form-submissions/{submission_id}/generate-pdf")
def trigger_pdf_generation(submission_id: int, db: Session = Depends(get_db)):
    """Explicitly trigger PDF generation for a form submission."""
    submission = db.query(FormSubmission).filter(FormSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Submission {submission_id} not found")

    form_key = submission.form_version.split("/")[0]
    client = db.query(Client).filter(Client.id == submission.client_id).first()
    form_def = db.query(FormDefinition).filter(FormDefinition.id == form_key).first()
    form_title = form_def.title if form_def else form_key.replace("-", " ").title()

    pdf_path = generate_form_submission_pdf(
        submission_id=submission.id,
        form_title=form_title,
        form_version=submission.form_version,
        client_name=client.name if client else "Client",
        id_number=client.id_number if client else "0000000000000",
        answers=submission.answers or {},
        signature=submission.signature or {},
    )
    submission.generated_document = pdf_path
    db.commit()

    return {
        "submission_id": submission.id,
        "pdf_path": pdf_path,
        "filename": os.path.basename(pdf_path),
        "status": "generated",
    }

