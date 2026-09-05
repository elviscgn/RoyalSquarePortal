from enum import Enum


class CaseTypeEnum(str, Enum):
    BANK_DETAILS_CHANGE = "bank_details_change"
    MOTOR_ACCIDENT = "motor_accident"
    ANNUAL_REVIEW = "annual_review"
    BENEFICIARY_CHANGE = "beneficiary_change"
    ONBOARDING = "onboarding"


class CaseStatusEnum(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    PENDING_CLIENT = "pending_client"
    PENDING_ADVISER = "pending_adviser"
    PENDING_PROVIDER = "pending_provider"
    COMPLETED = "completed"
    REJECTED = "rejected"


class PriorityEnum(str, Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class StepOwnerEnum(str, Enum):
    CLIENT = "client"
    ADVISER = "adviser"
    SYSTEM = "system"
    PROVIDER = "provider"


class StepStatusEnum(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"
    BLOCKED = "blocked"


class AuditActorEnum(str, Enum):
    CLIENT = "client"
    ADVISER = "adviser"
    SYSTEM = "system"
    PROVIDER = "provider"


class AuditActionEnum(str, Enum):
    CASE_CREATED = "case_created"
    WORKFLOW_STARTED = "workflow_started"
    WORKFLOW_TRANSITIONED = "workflow_transitioned"
    DOCUMENT_UPLOADED = "document_uploaded"
    BANK_STATEMENT_VALIDATED = "bank_statement_validated"
    FORM_STARTED = "form_started"
    FORM_SUBMITTED = "form_submitted"
    CLIENT_SIGNED = "client_signed"
    ADVISER_APPROVED = "adviser_approved"
    ADVISER_REJECTED = "adviser_rejected"
    PROVIDER_SUBMITTED = "provider_submitted"
    PROVIDER_ACCEPTED = "provider_accepted"
    PROVIDER_REJECTED = "provider_rejected"
    CASE_COMPLETED = "case_completed"
    ACCIDENT_SYNCED = "accident_synced"
