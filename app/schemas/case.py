from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.enums import CaseTypeEnum, CaseStatusEnum, PriorityEnum
from app.schemas.workflow import WorkflowStepOut
from app.schemas.client import ClientOut


class ComplianceChecklist(BaseModel):
    identity_verified: bool = True
    consent_valid: bool = True
    instruction_recorded: bool = True
    required_evidence_complete: bool = False
    disclosure_delivered: bool = True
    audit_trail_ready: bool = True


class CaseBase(BaseModel):
    client_id: str
    adviser_id: Optional[str] = None
    case_type: CaseTypeEnum
    priority: PriorityEnum = PriorityEnum.MEDIUM
    metadata_json: Optional[Dict[str, Any]] = Field(default_factory=dict)


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    status: Optional[CaseStatusEnum] = None
    priority: Optional[PriorityEnum] = None
    adviser_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None


class CaseOut(CaseBase):
    id: str
    status: CaseStatusEnum
    current_step_id: Optional[str] = None
    current_state: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CaseDetailOut(CaseOut):
    client: Optional[ClientOut] = None
    current_step: Optional[WorkflowStepOut] = None
    steps: List[WorkflowStepOut] = []
    compliance_state: ComplianceChecklist = Field(default_factory=ComplianceChecklist)
    action_required_from: Optional[str] = None
    provider_status: Optional[str] = None
    provider_reference: Optional[str] = None


class CaseFilterParams(BaseModel):
    client_id: Optional[str] = None
    adviser_id: Optional[str] = None
    case_type: Optional[CaseTypeEnum] = None
    status: Optional[CaseStatusEnum] = None
    priority: Optional[PriorityEnum] = None
