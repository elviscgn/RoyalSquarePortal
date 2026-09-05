from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.case import CaseOut
from app.schemas.enums import CaseTypeEnum, PriorityEnum, CaseStatusEnum


class TriageCounts(BaseModel):
    needs_attention: int = 0
    waiting_on_client: int = 0
    waiting_on_provider: int = 0
    compliance_exceptions: int = 0
    reviews_this_week: int = 0
    total_active_cases: int = 0


class RecentActivityItem(BaseModel):
    id: str
    case_id: str
    client_name: str
    case_type: CaseTypeEnum
    action: str
    actor: str
    description: str
    timestamp: datetime


class PriorityCaseSummary(BaseModel):
    id: str
    client_id: str
    client_name: str
    case_type: CaseTypeEnum
    priority: PriorityEnum
    status: CaseStatusEnum
    current_state: str
    current_step_title: str
    action_required_from: str
    created_at: datetime


class AdviserDashboardOut(BaseModel):
    adviser_id: str
    adviser_name: str
    triage: TriageCounts
    priority_cases: List[PriorityCaseSummary] = []
    recent_activity: List[RecentActivityItem] = []
