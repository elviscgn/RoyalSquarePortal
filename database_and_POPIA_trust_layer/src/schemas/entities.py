from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from src.database.enums import CaseType, WorkflowStepOwner, EvidenceType


# =============================================================================
# Adviser Schemas
# =============================================================================
class AdviserBase(BaseModel):
    name: str
    email: str


class AdviserResponse(AdviserBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Goal Schemas
# =============================================================================
class GoalBase(BaseModel):
    name: str
    target_amount: Decimal
    current_amount: Decimal = Decimal("0.00")
    status: str = "in_progress"


class GoalCreate(GoalBase):
    client_id: int


class GoalResponse(GoalBase):
    id: int
    client_id: int
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# ComplianceState Schemas
# =============================================================================
class ComplianceStateBase(BaseModel):
    identity_verified: bool = False
    consent_valid: bool = False
    pep_screening_clear: bool = False
    documents_complete: bool = False
    instruction_recorded: bool = False
    disclosure_delivered: bool = False
    audit_trail_ready: bool = False


class ComplianceStateResponse(ComplianceStateBase):
    id: int
    client_id: int
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# WorkflowStep Schemas
# =============================================================================
class WorkflowStepBase(BaseModel):
    key: str
    title: str
    owner: WorkflowStepOwner
    status: str = "pending"
    order: int = 1
    required_evidence: Optional[str] = None
    due_date: Optional[datetime] = None
    completion_timestamp: Optional[datetime] = None


class WorkflowStepResponse(WorkflowStepBase):
    id: int
    case_id: int
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Evidence Schemas
# =============================================================================
class EvidenceBase(BaseModel):
    type: EvidenceType
    file: str
    extracted_data: Dict[str, Any] = Field(default_factory=dict)
    validation_state: str = "pending"
    location: Optional[str] = None


class EvidenceCreate(EvidenceBase):
    client_id: int
    case_id: int


class EvidenceResponse(EvidenceBase):
    id: int
    client_id: int
    case_id: int
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# FormDefinition & FormSubmission Schemas
# =============================================================================
class FormDefinitionResponse(BaseModel):
    id: str  # form_key
    title: str
    version: str
    fields: List[Dict[str, Any]]
    validation_rules: Dict[str, Any]
    profile_mappings: Dict[str, Any]
    model_config = ConfigDict(from_attributes=True)


class FormSubmissionBase(BaseModel):
    form_version: str
    answers: Dict[str, Any] = Field(default_factory=dict)
    signature: Optional[Dict[str, Any]] = Field(default_factory=dict)
    status: str = "submitted"
    generated_document: Optional[str] = None


class FormSubmissionCreate(FormSubmissionBase):
    client_id: int
    case_id: int


class FormSubmissionResponse(FormSubmissionBase):
    id: int
    client_id: int
    case_id: int
    submitted_timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# AuditEvent Schemas
# =============================================================================
class AuditEventBase(BaseModel):
    actor: str
    action: str
    case_id: Optional[int] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class AuditEventCreate(AuditEventBase):
    pass


class AuditEventResponse(BaseModel):
    id: int
    actor: str
    action: str
    timestamp: datetime
    case_id: Optional[int] = None
    metadata: Dict[str, Any]

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm(cls, obj: Any) -> "AuditEventResponse":
        return cls(
            id=obj.id,
            actor=obj.actor,
            action=obj.action,
            timestamp=obj.timestamp,
            case_id=obj.case_id,
            metadata=obj.metadata,
        )


# =============================================================================
# Case Schemas
# =============================================================================
class CaseBase(BaseModel):
    client_id: int
    adviser_id: int
    case_type: CaseType
    status: str = "open"
    priority: str = "normal"
    current_step: Optional[str] = None


class CaseCreate(CaseBase):
    pass


class CaseResponse(CaseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CaseDetailResponse(CaseResponse):
    workflow_steps: List[WorkflowStepResponse] = []
    evidence: List[EvidenceResponse] = []
    form_submissions: List[FormSubmissionResponse] = []
    audit_events: List[AuditEventResponse] = []
    model_config = ConfigDict(from_attributes=True)


# =============================================================================
# Client Schemas
# =============================================================================
class ClientBase(BaseModel):
    name: str
    id_number: str
    address: Optional[str] = None
    mobile: Optional[str] = None
    email: str
    adviser_id: int
    financial_position: Dict[str, Any] = Field(default_factory=dict)
    consent_state: str = "pending"
    consent_version: str = "v1.0"
    consent_revoked: bool = False
    retention_status: str = "active"
    deletion_request_state: str = "none"


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None
    financial_position: Optional[Dict[str, Any]] = None
    consent_state: Optional[str] = None
    consent_revoked: Optional[bool] = None
    retention_status: Optional[str] = None
    deletion_request_state: Optional[str] = None


class ClientResponse(ClientBase):
    id: int
    consent_timestamp: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ClientOverviewResponse(ClientResponse):
    compliance_state: Optional[ComplianceStateResponse] = None
    goals: List[GoalResponse] = []
    active_cases_count: int = 0
    model_config = ConfigDict(from_attributes=True)
