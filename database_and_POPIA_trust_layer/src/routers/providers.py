from abc import ABC, abstractmethod
from datetime import datetime, timezone
import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.database.config import get_db
from src.database.models import Case, AuditEvent, WorkflowStep

router = APIRouter(tags=["Mock Provider Adapters"])


# =============================================================================
# Provider Abstraction Interface
# =============================================================================
class BaseProviderAdapter(ABC):
    """Abstract interface for financial institution and insurer provider gateways."""

    @abstractmethod
    def submit_banking_details(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def register_motor_claim(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        pass


class MockProviderAdapter(BaseProviderAdapter):
    """Deterministic simulated provider adapter for hackathon execution.
    Can simulate Discovery, Old Mutual, Sanlam, and Momentum behind a single clean adapter.
    """

    SUPPORTED_BRANDS = ["Discovery", "Old Mutual", "Sanlam", "Momentum", "Standard Bank"]

    def submit_banking_details(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        brand = payload.get("provider_brand") or payload.get("bank_name") or "Standard Bank"
        ref = payload.get("custom_reference") or f"RSF-MOCK-2841"
        account_num = str(payload.get("account_number", "10192837465"))

        return {
            "status": "accepted",
            "providerReference": ref,
            "provider_reference": ref,
            "provider_brand": brand,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": f"Banking details update successfully accepted and verified by {brand} clearinghouse gateway.",
            "metadata": {
                "account_holder": payload.get("client_name") or payload.get("account_holder"),
                "bank": brand,
                "masked_account": f"****{account_num[-4:]}" if len(account_num) >= 4 else account_num,
                "cdv_algorithm_result": "PASS",
                "disbursement_active": True,
            },
        }

    def register_motor_claim(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        brand = payload.get("provider_brand") or "Discovery Insure"
        ref = f"RSF-CLM-{uuid.uuid4().hex[:6].upper()}"
        claim_num = f"DN-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:5].upper()}"

        return {
            "status": "accepted",
            "providerReference": ref,
            "provider_reference": ref,
            "claimNumber": claim_num,
            "claim_number": claim_num,
            "provider_brand": brand,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": f"Motor accident claim registered with {brand}. Assessor dispatch initiated.",
            "metadata": {
                "policy_number": payload.get("policy_number", "POL-849102"),
                "claim_handler": "Automated Claims Dispatch Unit",
                "excess_payable": 0.00,
            },
        }


provider_adapter = MockProviderAdapter()


# =============================================================================
# Request Payloads
# =============================================================================
class ProviderBankingPayload(BaseModel):
    client_name: str
    id_number: str
    bank_name: str
    account_number: str
    branch_code: str
    account_holder: Optional[str] = None
    provider_brand: Optional[str] = None


class ProviderClaimPayload(BaseModel):
    case_id: int
    client_id: int
    policy_number: str = "POL-849102"
    claim_type: str = "motor_accident"
    provider_brand: Optional[str] = "Discovery Insure"


# =============================================================================
# Endpoints (Mounting on both /provider and /api/providers for contract safety)
# =============================================================================
@router.post("/provider/banking-details")
@router.post("/api/providers/banking-details")
def submit_banking_details_to_provider(payload: ProviderBankingPayload):
    """Simulated provider adapter for banking-details update (Discovery / Old Mutual / Sanlam / Standard Bank).
    Returns standard mock accepted response contract with providerReference: RSF-MOCK-2841.
    """
    return provider_adapter.submit_banking_details(payload.model_dump())


@router.post("/provider/claims")
@router.post("/api/providers/claims")
def register_motor_claim_with_provider(payload: ProviderClaimPayload):
    """Simulated provider adapter for motor claims registration with insurers."""
    return provider_adapter.register_motor_claim(payload.model_dump())


@router.post("/api/cases/{case_id}/submit-to-provider")
def submit_case_to_provider(case_id: int, provider_brand: Optional[str] = "Discovery", db: Session = Depends(get_db)):
    """Workflow integration: Submits an approved case directly to the mock provider adapter,
    updates case status, completes the provider step, and records audit trail events.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Case {case_id} not found")

    client = case.client
    now = datetime.now(timezone.utc)

    # Call adapter
    if "bank" in case.case_type.value:
        res = provider_adapter.submit_banking_details({
            "client_name": client.name if client else "Client",
            "id_number": client.id_number if client else "",
            "bank_name": "Standard Bank",
            "account_number": "10192837465",
            "branch_code": "051001",
            "provider_brand": provider_brand,
        })
    else:
        res = provider_adapter.register_motor_claim({
            "case_id": case.id,
            "client_id": client.id if client else 0,
            "provider_brand": provider_brand,
        })

    # Record provider audit events
    db.add(
        AuditEvent(
            actor="adviser:qiniso_ntuli",
            action="provider_submitted",
            case_id=case.id,
            metadata={"provider": provider_brand, "request": "dispatch"},
        )
    )
    db.add(
        AuditEvent(
            actor=f"provider:{provider_brand.lower().replace(' ', '_')}",
            action="provider_accepted",
            case_id=case.id,
            metadata=res,
        )
    )

    # Advance workflow step
    provider_step = (
        db.query(WorkflowStep)
        .filter(WorkflowStep.case_id == case.id, WorkflowStep.key.in_(["provider_submission", "claim_registration"]))
        .first()
    )
    if provider_step:
        provider_step.status = "completed"
        provider_step.completion_timestamp = now

    case.status = "completed"
    case.current_step = "completed"
    case.updated_at = now

    db.add(
        AuditEvent(
            actor="system",
            action="case_completed",
            case_id=case.id,
            metadata={"final_status": "completed", "provider_reference": res.get("providerReference")},
        )
    )

    db.commit()
    db.refresh(case)

    return {
        "case_id": case.id,
        "status": case.status,
        "current_step": case.current_step,
        "provider_response": res,
    }

