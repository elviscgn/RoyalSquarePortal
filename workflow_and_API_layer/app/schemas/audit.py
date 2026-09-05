from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.schemas.enums import AuditActorEnum, AuditActionEnum


class AuditEventCreate(BaseModel):
    case_id: str
    actor: AuditActorEnum
    action: AuditActionEnum
    metadata_json: Optional[Dict[str, Any]] = Field(default_factory=dict)
    timestamp: Optional[datetime] = None


class AuditEventOut(BaseModel):
    id: str
    case_id: str
    actor: AuditActorEnum
    action: AuditActionEnum
    metadata_json: Optional[Dict[str, Any]] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


class AuditTimelineOut(BaseModel):
    case_id: str
    total_events: int
    events: List[AuditEventOut]
