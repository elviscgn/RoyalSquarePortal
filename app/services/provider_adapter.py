import uuid
from datetime import datetime, timezone
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.schemas.provider import ProviderSubmissionResponse


class BaseProviderAdapter(ABC):
    """Abstract interface for provider integrations (e.g., Discovery, Old Mutual, Standard Bank)."""

    @abstractmethod
    def submit_banking_details(
        self, case_id: str, client_id: str, payload: Dict[str, Any]
    ) -> ProviderSubmissionResponse:
        pass

    @abstractmethod
    def register_motor_claim(
        self, case_id: str, client_id: str, payload: Dict[str, Any]
    ) -> ProviderSubmissionResponse:
        pass


class MockProviderAdapter(BaseProviderAdapter):
    """Deterministic simulated provider adapter for hackathon execution."""

    def submit_banking_details(
        self, case_id: str, client_id: str, payload: Dict[str, Any]
    ) -> ProviderSubmissionResponse:
        ref = f"RSF-BANK-{uuid.uuid4().hex[:6].upper()}"
        return ProviderSubmissionResponse(
            status="accepted",
            provider_reference=ref,
            timestamp=datetime.now(timezone.utc),
            message="Banking instruction successfully verified and submitted to provider gateway.",
            metadata={
                "bank": payload.get("bank", "Standard Bank"),
                "account_number_masked": "****" + str(payload.get("account_number", "1234"))[-4:],
                "gateway_status_code": 200,
            }
        )

    def register_motor_claim(
        self, case_id: str, client_id: str, payload: Dict[str, Any]
    ) -> ProviderSubmissionResponse:
        ref = f"RSF-CLM-{uuid.uuid4().hex[:6].upper()}"
        return ProviderSubmissionResponse(
            status="accepted",
            provider_reference=ref,
            timestamp=datetime.now(timezone.utc),
            message="Motor accident claim registered with insurer. Claim reference assigned.",
            metadata={
                "policy_number": payload.get("policy_number", "POL-99214"),
                "claim_handler": "Automated Claims Dispatch",
            }
        )


provider_adapter = MockProviderAdapter()
