from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.schemas.enums import StepOwnerEnum, StepStatusEnum


class WorkflowStepBase(BaseModel):
    key: str
    title: str
    owner: StepOwnerEnum
    order: int
    required_evidence: Optional[str] = None


class WorkflowStepOut(WorkflowStepBase):
    id: str
    case_id: str
    status: StepStatusEnum
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}


class StepCompleteRequest(BaseModel):
    actor: StepOwnerEnum = StepOwnerEnum.CLIENT
    actor_id: Optional[str] = None
    input_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    comment: Optional[str] = None


class StateTransitionResult(BaseModel):
    success: bool
    previous_state: str
    new_state: str
    case_status: str
    completed_step_id: Optional[str] = None
    next_step_id: Optional[str] = None
    message: str
