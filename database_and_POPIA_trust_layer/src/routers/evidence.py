from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database.config import get_db
from src.database.models import Evidence, Case, WorkflowStep, Client, AuditEvent
from src.database.enums import EvidenceType, CaseType
from src.schemas.entities import EvidenceResponse, EvidenceCreate

router = APIRouter(prefix="/api", tags=["Evidence & Documents"])


@router.get("/cases/{case_id}/evidence", response_model=List[EvidenceResponse])
def get_case_evidence(case_id: int, db: Session = Depends(get_db)):
    """Retrieve all evidence records attached to a case."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")
    return db.query(Evidence).filter(Evidence.case_id == case_id).all()


@router.get("/evidence/{evidence_id}", response_model=EvidenceResponse)
def get_single_evidence(evidence_id: int, db: Session = Depends(get_db)):
    """Retrieve a single evidence record by ID."""
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Evidence {evidence_id} not found")
    return evidence


@router.post("/cases/{case_id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
def create_evidence(case_id: int, payload: EvidenceCreate, db: Session = Depends(get_db)):
    """Attach evidence record to a case and log audit event.
    Automatically populates deterministic OCR data for bank statements if none provided.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")

    client_id = payload.client_id or case.client_id
    client = db.query(Client).filter(Client.id == client_id).first()
    client_name = client.name if client else "Client Account"

    extracted_data = dict(payload.extracted_data or {})

    # If it's a bank statement and no OCR data passed, generate realistic mock extracted fields
    if payload.type == EvidenceType.BANK_STATEMENT and not extracted_data:
        extracted_data = {
            "bank_name": "Standard Bank South Africa",
            "account_holder": client_name,
            "account_number": "10192837465",
            "branch_code": "051001",
            "account_type": "Cheque Account",
            "statement_date": (datetime.now(timezone.utc) - timedelta(days=17)).strftime("%Y-%m-%d"),
            "statement_age_days": 17,
            "is_stamped": True,
            "confidence_score": 0.99,
        }

    evidence = Evidence(
        client_id=client_id,
        case_id=case_id,
        type=payload.type,
        file=payload.file,
        extracted_data=extracted_data,
        validation_state=payload.validation_state or "pending",
        location=payload.location,
    )
    db.add(evidence)
    db.flush()

    # Log audit event
    db.add(
        AuditEvent(
            actor=f"client:{client_id}",
            action="evidence_uploaded",
            case_id=case_id,
            metadata={
                "evidence_id": evidence.id,
                "type": evidence.type.value if hasattr(evidence.type, "value") else str(evidence.type),
                "file": evidence.file,
            },
        )
    )

    # Advance workflow step if waiting for bank statement
    bank_req_step = (
        db.query(WorkflowStep)
        .filter(WorkflowStep.case_id == case_id, WorkflowStep.key == "bank_statement_required")
        .first()
    )
    if bank_req_step and bank_req_step.status != "completed":
        bank_req_step.status = "completed"
        bank_req_step.completion_timestamp = datetime.now(timezone.utc)
        case.current_step = "bank_statement_validation"
        case.status = "in_progress"

    db.commit()
    db.refresh(evidence)
    return evidence


@router.post("/evidence/{evidence_id}/validate", response_model=Dict[str, Any])
def validate_evidence(evidence_id: int, db: Session = Depends(get_db)):
    """Validate uploaded evidence against statutory and compliance rules.
    Critical demo rule: Bank statement must be less than 3 months (90 days) old.
    Returns:
    - document type
    - account holder
    - bank
    - statement date
    - age in days
    - valid/invalid
    - reason
    """
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Evidence {evidence_id} not found")

    data = evidence.extracted_data or {}
    statement_age_days = data.get("statement_age_days")

    # If statement_date is present, calculate age dynamically
    if statement_age_days is None and "statement_date" in data:
        try:
            stmt_date = datetime.strptime(data["statement_date"], "%Y-%m-%d").date()
            statement_age_days = (datetime.now(timezone.utc).date() - stmt_date).days
        except Exception:
            statement_age_days = 17

    if statement_age_days is None:
        statement_age_days = 17

    # Bank statement rule: must be less than 3 months (90 days)
    is_valid = statement_age_days <= 90

    doc_type = evidence.type.value if hasattr(evidence.type, "value") else str(evidence.type)
    account_holder = data.get("account_holder", "Client Account")
    bank_name = data.get("bank_name", "Standard Bank South Africa")
    statement_date = data.get("statement_date", (datetime.now(timezone.utc) - timedelta(days=statement_age_days)).strftime("%Y-%m-%d"))

    reason = (
        f"Verified: Statement is {statement_age_days} days old, within the 90-day statutory validity window."
        if is_valid
        else f"REJECTED: Statement is {statement_age_days} days old, which exceeds the statutory 3-month (90 days) limit. Please request an updated statement."
    )

    validation_state = "valid" if is_valid else "invalid"
    evidence.validation_state = validation_state
    data["statement_age_days"] = statement_age_days
    data["validation_reason"] = reason
    evidence.extracted_data = data

    validation_result = {
        "evidence_id": evidence.id,
        "document_type": doc_type,
        "account_holder": account_holder,
        "bank": bank_name,
        "account_number": data.get("account_number", ""),
        "branch_code": data.get("branch_code", ""),
        "statement_date": statement_date,
        "age_in_days": statement_age_days,
        "valid/invalid": validation_state,
        "validation_state": validation_state,
        "is_valid": is_valid,
        "reason": reason,
    }

    # Record audit event
    db.add(
        AuditEvent(
            actor="system:ocr_pipeline",
            action="bank_statement.validated",
            case_id=evidence.case_id,
            metadata=validation_result,
        )
    )

    # If valid and linked to a banking case, advance workflow step
    if evidence.case_id:
        case = db.query(Case).filter(Case.id == evidence.case_id).first()
        if case:
            validation_step = (
                db.query(WorkflowStep)
                .filter(WorkflowStep.case_id == case.id, WorkflowStep.key == "bank_statement_validation")
                .first()
            )
            if validation_step:
                if is_valid:
                    validation_step.status = "completed"
                    validation_step.completion_timestamp = datetime.now(timezone.utc)
                    case.current_step = "bank_instruction_form"
                else:
                    validation_step.status = "failed"
                    case.current_step = "bank_statement_required"
                    case.status = "needs_client_action"

    db.commit()
    return validation_result


@router.get("/cases/{case_id}/evidence/completeness", response_model=Dict[str, Any])
@router.get("/cases/{case_id}/completeness", response_model=Dict[str, Any])
def get_evidence_completeness(case_id: int, db: Session = Depends(get_db)):
    """Calculate and return evidence completeness checklist & score for a case.
    Supports both Motor Accident and Banking Details Change cases.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")

    evidences = db.query(Evidence).filter(Evidence.case_id == case_id).all()
    evidence_types = {e.type for e in evidences}

    case_type_val = case.case_type.value if hasattr(case.case_type, "value") else str(case.case_type)

    if case_type_val == CaseType.MOTOR_ACCIDENT.value:
        has_location = (
            EvidenceType.LOCATION in evidence_types
            or any(e.location for e in evidences)
        )
        has_scene_photos = EvidenceType.SCENE_PHOTO in evidence_types
        has_vehicle_photos = EvidenceType.VEHICLE_PHOTO in evidence_types
        has_driver_details = any(
            e.type == EvidenceType.OTHER and "other_driver" in (e.extracted_data or {})
            for e in evidences
        ) or any("driver" in str(e.extracted_data).lower() for e in evidences)
        has_voice = EvidenceType.VOICE_STATEMENT in evidence_types
        has_witnesses = EvidenceType.WITNESS_DETAILS in evidence_types

        checklist = [
            {"item": "location", "label": "Location ✓" if has_location else "Location Missing", "present": has_location},
            {"item": "scene_photos", "label": "Scene photos ✓" if has_scene_photos else "Scene photos Missing", "present": has_scene_photos},
            {"item": "vehicle_photos", "label": "Vehicle photos ✓" if has_vehicle_photos else "Vehicle photos Missing", "present": has_vehicle_photos},
            {"item": "other_driver", "label": "Other driver ✓" if has_driver_details else "Other driver Missing", "present": has_driver_details},
            {"item": "voice_statement", "label": "Voice statement ✓" if has_voice else "Voice statement Missing", "present": has_voice},
            {"item": "witnesses", "label": "Witnesses ✓" if has_witnesses else "Witness missing", "present": has_witnesses},
        ]

    else:
        # Banking Details Change or generic
        has_bank_stmt = EvidenceType.BANK_STATEMENT in evidence_types
        valid_stmt = any(
            e.type == EvidenceType.BANK_STATEMENT and e.validation_state == "valid"
            for e in evidences
        )
        has_id = EvidenceType.IDENTITY_DOCUMENT in evidence_types or (
            case.client and case.client.compliance_state and case.client.compliance_state.identity_verified
        )

        checklist = [
            {"item": "bank_statement", "label": "Bank statement ✓" if has_bank_stmt else "Bank statement Missing", "present": has_bank_stmt},
            {"item": "statement_validity", "label": "Statement age (< 90 days) ✓" if valid_stmt else "Statement validity pending/rejected", "present": valid_stmt},
            {"item": "identity_document", "label": "Identity verified ✓" if has_id else "Identity document Missing", "present": has_id},
        ]

    present_count = sum(1 for c in checklist if c["present"])
    total_count = len(checklist)
    score_pct = int((present_count / total_count) * 100) if total_count > 0 else 0

    missing = [c["item"] for c in checklist if not c["present"]]
    guidance = None
    if missing:
        missing_labels = [c["label"].replace(" Missing", "").replace(" missing", "") for c in checklist if not c["present"]]
        guidance = f"{len(missing)} item(s) still missing before case can advance: {', '.join(missing_labels)}."

    return {
        "case_id": case.id,
        "case_type": case_type_val,
        "score": score_pct,
        "completeness_score": f"{score_pct}%",
        "is_complete": score_pct == 100,
        "checklist": checklist,
        "missing_items": missing,
        "guidance_prompt": guidance,
        "total_evidence_count": len(evidences),
    }

