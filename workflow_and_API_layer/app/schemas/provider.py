from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class ProviderSubmissionRequest(BaseModel):
    case_id: str
    client_id: str
    provider_name: str = "Standard Bank / Royal Square Provider Gateway"
    instruction_type: str = "banking_details_update"
    payload: Dict[str, Any] = Field(default_factory=dict)


class ProviderSubmissionResponse(BaseModel):
    status: str = "accepted"
    provider_reference: str
    timestamp: datetime
    message: str = "Instruction accepted by provider"
    metadata: Optional[Dict[str, Any]] = None
