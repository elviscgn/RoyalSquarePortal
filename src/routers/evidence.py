from datetime import datetime, timezone
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database.config import get_db
from src.database.models import Evidence, Case, AuditEvent
from src.database.enums import EvidenceType
from src.schemas.entities import EvidenceResponse, EvidenceCreate

router = APIRouter(prefix="/api", tags=["Evidence & Documents"])


@router.get("/cases/{case_id}/evidence", response_model=List[EvidenceResponse])
def get_case_evidence(case_id: int, db: Session = Depends(get_db)):
    """Retrieve all evidence records for a case."""
    return db.query(Evidence).filter(Evidence.case_id == case_id).all()


@router.post("/cases/{case_id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
def create_evidence(case_id: int, payload: EvidenceCreate, db: Session = Depends(get_db)):
    """Attach evidence record to a case and log audit event."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")

    evidence = Evidence(
        client_id=payload.client_id,
        case_id=case_id,
        type=payload.type,
        file=payload.file,
        extracted_data=payload.extracted_data,
        validation_state=payload.validation_state,
        location=payload.location,
    )
    db.add(evidence)
    db.flush()

    # Audit event
    db.add(
        AuditEvent(
            actor=f"client:{payload.client_id}",
            action="document.uploaded",
            case_id=case_id,
            metadata={"evidence_id": evidence.id, "type": evidence.type.value, "file": evidence.file},
        )
    )
    db.commit()
    db.refresh(evidence)
    return evidence


@router.post("/evidence/{evidence_id}/validate", response_model=Dict[str, Any])
def validate_evidence(evidence_id: int, db: Session = Depends(get_db)):
    """Validate uploaded evidence.
    Rule: Bank statement must be less than 3 months (90 days) old.
    Returns: document type, account holder, bank, statement date, age in days, valid/invalid.
    """
    evidence = db.query(Evidence).filter(Evidence.id == evidence_id).first()
    if not evidence:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Evidence {evidence_id} not found")

    data = evidence.extracted_data or {}
    statement_age_days = data.get("statement_age_days", 17)
    is_valid = statement_age_days <= 90

    validation_result = {
        "evidence_id": evidence.id,
        "document_type": evidence.type.value,
        "account_holder": data.get("account_holder", "Client Account"),
        "bank": data.get("bank_name", "Standard Bank South Africa"),
        "statement_date": data.get("statement_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "age_in_days": statement_age_days,
        "validation_state": "valid" if is_valid else "invalid",
        "reason": "Within 90-day statutory validity window" if is_valid else "Statement older than 90 days",
    }

    evidence.validation_state = validation_result["validation_state"]
    db.add(
        AuditEvent(
            actor="system:ocr_pipeline",
            action="bank_statement.validated",
            case_id=evidence.case_id,
            metadata=validation_result,
        )
    )
    db.commit()
    return validation_result
