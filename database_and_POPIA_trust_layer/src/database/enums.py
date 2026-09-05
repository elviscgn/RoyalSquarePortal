import enum


class CaseType(str, enum.Enum):
    BANK_DETAILS_CHANGE = "bank_details_change"
    MOTOR_ACCIDENT = "motor_accident"
    ANNUAL_REVIEW = "annual_review"
    BENEFICIARY_CHANGE = "beneficiary_change"
    ONBOARDING = "onboarding"


class WorkflowStepOwner(str, enum.Enum):
    CLIENT = "client"
    ADVISER = "adviser"
    SYSTEM = "system"
    PROVIDER = "provider"


class EvidenceType(str, enum.Enum):
    BANK_STATEMENT = "bank_statement"
    IDENTITY_DOCUMENT = "identity_document"
    SCENE_PHOTO = "scene_photo"
    VEHICLE_PHOTO = "vehicle_photo"
    VOICE_STATEMENT = "voice_statement"
    WITNESS_DETAILS = "witness_details"
    LOCATION = "location"
    OTHER = "other"
