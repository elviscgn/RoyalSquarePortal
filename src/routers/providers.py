from typing import Any, Dict
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/provider", tags=["Mock Provider Adapters"])


class ProviderBankingPayload(BaseModel):
    client_name: str
    id_number: str
    bank_name: str
    account_number: str
    branch_code: str


class ProviderClaimPayload(BaseModel):
    case_id: int
    client_id: int
    policy_number: str = "POL-849102"
    claim_type: str = "motor_accident"


@router.post("/banking-details")
def submit_banking_details_to_provider(payload: ProviderBankingPayload):
    """Simulated provider adapter for banking-details update (Discovery / Old Mutual / Sanlam).
    Returns standard mock accepted response contract.
    """
    return {
        "status": "accepted",
        "providerReference": "RSF-MOCK-2841",
        "timestamp": "2026-09-05T12:00:00Z",
        "notes": "Banking details successfully validated against CDV algorithms and updated on provider mainframe.",
    }


@router.post("/claims")
def register_motor_claim_with_provider(payload: ProviderClaimPayload):
    """Simulated provider adapter for motor claims registration."""
    return {
        "status": "accepted",
        "providerReference": "CLM-DISCOVERY-9042",
        "claimNumber": "DN-2026-99201",
        "assessor_assigned": "J. van der Merwe (Assessors Inc.)",
    }
