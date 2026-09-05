from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class ClientBase(BaseModel):
    name: str 
    id_number: str
    email: EmailStr
    mobile: str
    address: str
    adviser_id: Optional[str] = None
    compliance_clear: bool = False


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    id_number: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    compliance_clear: Optional[bool] = None


class ClientOut(ClientBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GoalSummary(BaseModel):
    id: str
    title: str
    progress_percentage: int
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    status: str = "on_track"


class FinancialOverview(BaseModel):
    net_worth: float = 0.0
    investments: float = 0.0
    retirement: float = 0.0
    insurance_coverage: float = 0.0
    assets: float = 0.0
    liabilities: float = 0.0


class ClientOverview(BaseModel):
    client: ClientOut
    financial_overview: FinancialOverview
    goals: List[GoalSummary] = []
    active_cases_count: int = 0
    needs_attention_count: int = 0
