from datetime import datetime, timezone
from typing import Optional, Dict, Any
from app.schemas.client import (
    ClientOut,
    ClientOverview,
    ClientUpdate,
    FinancialOverview,
    GoalSummary,
)
from app.schemas.case import CaseFilterParams
from app.services.case_service import case_service


class ClientService:
    """Service layer for Client profile, financial overview, and goals."""

    def __init__(self):
        # Demo client seed store
        self._clients: Dict[str, Dict[str, Any]] = {
            "cli-001": {
                "id": "cli-001",
                "name": "Naledi Mokoena",
                "id_number": "8805125029088",
                "email": "naledi.mokoena@example.co.za",
                "mobile": "+27 82 555 1234",
                "address": "12 Example Street, Sandton, Johannesburg, 2196",
                "adviser_id": "adv-001",
                "compliance_clear": True,
                "created_at": datetime(2025, 1, 10, 8, 0, 0, tzinfo=timezone.utc),
                "updated_at": datetime(2025, 1, 10, 8, 0, 0, tzinfo=timezone.utc),
            },
            "cli-002": {
                "id": "cli-002",
                "name": "Sipho Dlamini",
                "id_number": "9102035123081",
                "email": "sipho.dlamini@example.co.za",
                "mobile": "+27 83 444 5678",
                "address": "45 Commissioner Street, Johannesburg, 2001",
                "adviser_id": "adv-001",
                "compliance_clear": True,
                "created_at": datetime(2025, 2, 15, 9, 30, 0, tzinfo=timezone.utc),
                "updated_at": datetime(2025, 2, 15, 9, 30, 0, tzinfo=timezone.utc),
            },
        }

    def get_client(self, client_id: str, db_session: Any = None) -> Optional[ClientOut]:
        """Retrieves verified client profile."""
        c = self._clients.get(client_id)
        if not c:
            return None
        return ClientOut(**c)

    def update_client(self, client_id: str, client_update: ClientUpdate, db_session: Any = None) -> Optional[ClientOut]:
        """Updates client profile attributes."""
        c = self._clients.get(client_id)
        if not c:
            return None
        
        update_data = client_update.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            c[key] = val
        c["updated_at"] = datetime.now(timezone.utc)
        return ClientOut(**c)

    def get_client_overview(self, client_id: str, db_session: Any = None) -> Optional[ClientOverview]:
        """Returns client profile along with financial overview, goals, and active case counts."""
        client = self.get_client(client_id, db_session=db_session)
        if not client:
            return None

        # Count active cases for this client
        client_cases = case_service.list_cases(CaseFilterParams(client_id=client_id), db_session=db_session)
        active_count = len([c for c in client_cases if c.status.value not in ("completed", "rejected")])
        needs_attention = len([c for c in client_cases if c.status.value == "pending_client"])

        financial = FinancialOverview(
            net_worth=1250000.00,
            investments=850000.00,
            retirement=600000.00,
            insurance_coverage=3500000.00,
            assets=1850000.00,
            liabilities=600000.00,
        )

        goals = [
            GoalSummary(id="goal-1", title="Home Deposit", progress_percentage=74, target_amount=300000, current_amount=222000, status="on_track"),
            GoalSummary(id="goal-2", title="Emergency Fund", progress_percentage=100, target_amount=150000, current_amount=150000, status="completed"),
            GoalSummary(id="goal-3", title="Retirement Annuity", progress_percentage=55, target_amount=2000000, current_amount=1100000, status="on_track"),
        ]

        return ClientOverview(
            client=client,
            financial_overview=financial,
            goals=goals,
            active_cases_count=active_count,
            needs_attention_count=needs_attention,
        )


client_service = ClientService()
