from datetime import datetime, timezone
from typing import Any, Dict
from decimal import Decimal

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Numeric,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    JSON,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from .config import Base
from .enums import CaseType, WorkflowStepOwner, EvidenceType

# Cross-dialect JSON type: uses native JSONB on PostgreSQL, standard JSON elsewhere
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")


class Adviser(Base):
    __tablename__ = "advisers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)

    # Relationships
    clients = relationship("Client", back_populates="adviser", cascade="all, delete-orphan")
    cases = relationship("Case", back_populates="adviser", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
        }


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    id_number = Column(String(20), nullable=False, index=True)
    address = Column(Text, nullable=True)
    mobile = Column(String(50), nullable=True)
    email = Column(String(255), nullable=False, index=True)

    adviser_id = Column(Integer, ForeignKey("advisers.id", ondelete="CASCADE"), nullable=False, index=True)

    # JSONB financial position: net_worth, assets, liabilities, investments, insurance, retirement
    financial_position = Column(JSON_TYPE, nullable=False, default=dict)

    # Consent & POPIA tracking
    consent_state = Column(String(50), nullable=False, default="pending")
    consent_version = Column(String(50), nullable=False, default="v1.0")
    consent_timestamp = Column(DateTime, nullable=True)
    consent_revoked = Column(Boolean, nullable=False, default=False)

    # Retention & deletion lifecycle
    retention_status = Column(String(50), nullable=False, default="active")
    deletion_request_state = Column(String(50), nullable=False, default="none")

    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    adviser = relationship("Adviser", back_populates="clients")
    cases = relationship("Case", back_populates="client", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="client", cascade="all, delete-orphan")
    evidence = relationship("Evidence", back_populates="client", cascade="all, delete-orphan")
    compliance_state = relationship(
        "ComplianceState", back_populates="client", uselist=False, cascade="all, delete-orphan"
    )
    form_submissions = relationship("FormSubmission", back_populates="client", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "id_number": self.id_number,
            "address": self.address,
            "mobile": self.mobile,
            "email": self.email,
            "adviser_id": self.adviser_id,
            "financial_position": self.financial_position,
            "consent_state": self.consent_state,
            "consent_version": self.consent_version,
            "consent_timestamp": self.consent_timestamp.isoformat() if self.consent_timestamp else None,
            "consent_revoked": self.consent_revoked,
            "retention_status": self.retention_status,
            "deletion_request_state": self.deletion_request_state,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    target_amount = Column(Numeric(14, 2), nullable=False)
    current_amount = Column(Numeric(14, 2), nullable=False, default=0.00)
    status = Column(String(50), nullable=False, default="in_progress")

    # Relationships
    client = relationship("Client", back_populates="goals")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "client_id": self.client_id,
            "name": self.name,
            "target_amount": float(self.target_amount) if isinstance(self.target_amount, Decimal) else self.target_amount,
            "current_amount": float(self.current_amount) if isinstance(self.current_amount, Decimal) else self.current_amount,
            "status": self.status,
        }


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    adviser_id = Column(Integer, ForeignKey("advisers.id", ondelete="CASCADE"), nullable=False, index=True)

    case_type = Column(
        SAEnum(CaseType, name="casetype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True,
    )
    status = Column(String(50), nullable=False, default="open", index=True)
    priority = Column(String(50), nullable=False, default="normal")
    current_step = Column(String(100), nullable=True)

    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    client = relationship("Client", back_populates="cases")
    adviser = relationship("Adviser", back_populates="cases")
    workflow_steps = relationship(
        "WorkflowStep",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="WorkflowStep.order",
    )
    evidence = relationship("Evidence", back_populates="case", cascade="all, delete-orphan")
    form_submissions = relationship("FormSubmission", back_populates="case", cascade="all, delete-orphan")
    audit_events = relationship("AuditEvent", back_populates="case", cascade="all, delete-orphan")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "client_id": self.client_id,
            "adviser_id": self.adviser_id,
            "case_type": self.case_type.value if hasattr(self.case_type, "value") else str(self.case_type),
            "status": self.status,
            "priority": self.priority,
            "current_step": self.current_step,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    key = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    owner = Column(
        SAEnum(WorkflowStepOwner, name="workflowstepowner", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    status = Column(String(50), nullable=False, default="pending")
    order = Column(Integer, nullable=False, default=1)
    required_evidence = Column(String(255), nullable=True)
    due_date = Column(DateTime, nullable=True)
    completion_timestamp = Column(DateTime, nullable=True)

    # Relationships
    case = relationship("Case", back_populates="workflow_steps")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "case_id": self.case_id,
            "key": self.key,
            "title": self.title,
            "owner": self.owner.value if hasattr(self.owner, "value") else str(self.owner),
            "status": self.status,
            "order": self.order,
            "required_evidence": self.required_evidence,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "completion_timestamp": self.completion_timestamp.isoformat() if self.completion_timestamp else None,
        }


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)

    type = Column(
        SAEnum(EvidenceType, name="evidencetype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
        index=True,
    )
    file = Column(String(500), nullable=False)
    extracted_data = Column(JSON_TYPE, nullable=False, default=dict)
    validation_state = Column(String(50), nullable=False, default="pending")
    timestamp = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    location = Column(String(500), nullable=True)

    # Relationships
    client = relationship("Client", back_populates="evidence")
    case = relationship("Case", back_populates="evidence")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "client_id": self.client_id,
            "case_id": self.case_id,
            "type": self.type.value if hasattr(self.type, "value") else str(self.type),
            "file": self.file,
            "extracted_data": self.extracted_data,
            "validation_state": self.validation_state,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "location": self.location,
        }


class FormDefinition(Base):
    __tablename__ = "form_definitions"

    # Use form_key as the id, e.g. "broker-appointment"
    id = Column(String(100), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False, default="v1.0")
    fields = Column(JSON_TYPE, nullable=False, default=list)
    validation_rules = Column(JSON_TYPE, nullable=False, default=dict)
    profile_mappings = Column(JSON_TYPE, nullable=False, default=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "version": self.version,
            "fields": self.fields,
            "validation_rules": self.validation_rules,
            "profile_mappings": self.profile_mappings,
        }


class FormSubmission(Base):
    __tablename__ = "form_submissions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True)
    form_version = Column(String(50), nullable=False)
    answers = Column(JSON_TYPE, nullable=False, default=dict)
    signature = Column(JSON_TYPE, nullable=True, default=dict)
    submitted_timestamp = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    status = Column(String(50), nullable=False, default="submitted")
    generated_document = Column(String(500), nullable=True)

    # Relationships
    client = relationship("Client", back_populates="form_submissions")
    case = relationship("Case", back_populates="form_submissions")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "client_id": self.client_id,
            "case_id": self.case_id,
            "form_version": self.form_version,
            "answers": self.answers,
            "signature": self.signature,
            "submitted_timestamp": self.submitted_timestamp.isoformat() if self.submitted_timestamp else None,
            "status": self.status,
            "generated_document": self.generated_document,
        }


class MetadataProxy:
    """Descriptor that preserves SQLAlchemy's class-level MetaData access
    while exposing the instance's 'metadata' column JSON payload.
    """
    def __get__(self, instance, owner):
        if instance is None:
            return owner.__table__.metadata
        return instance.metadata_

    def __set__(self, instance, value):
        instance.metadata_ = value


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    actor = Column(String(100), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    case_id = Column(Integer, ForeignKey("cases.id", ondelete="SET NULL"), nullable=True, index=True)

    # Column in DB is named 'metadata'
    metadata_ = Column("metadata", JSON_TYPE, nullable=False, default=dict)
    metadata = MetadataProxy()

    # Relationships
    case = relationship("Case", back_populates="audit_events")

    def __init__(self, **kwargs):
        if "metadata" in kwargs and "metadata_" not in kwargs:
            kwargs["metadata_"] = kwargs.pop("metadata")
        super().__init__(**kwargs)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "actor": self.actor,
            "action": self.action,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "case_id": self.case_id,
            "metadata": self.metadata_,
        }


class ComplianceState(Base):
    __tablename__ = "compliance_states"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)

    identity_verified = Column(Boolean, nullable=False, default=False)
    consent_valid = Column(Boolean, nullable=False, default=False)
    pep_screening_clear = Column(Boolean, nullable=False, default=False)
    documents_complete = Column(Boolean, nullable=False, default=False)
    instruction_recorded = Column(Boolean, nullable=False, default=False)
    disclosure_delivered = Column(Boolean, nullable=False, default=False)
    audit_trail_ready = Column(Boolean, nullable=False, default=False)

    # Relationships
    client = relationship("Client", back_populates="compliance_state")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "client_id": self.client_id,
            "identity_verified": self.identity_verified,
            "consent_valid": self.consent_valid,
            "pep_screening_clear": self.pep_screening_clear,
            "documents_complete": self.documents_complete,
            "instruction_recorded": self.instruction_recorded,
            "disclosure_delivered": self.disclosure_delivered,
            "audit_trail_ready": self.audit_trail_ready,
        }
