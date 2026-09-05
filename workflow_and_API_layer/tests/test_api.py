import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


def test_clients_and_overview():
    res = client.get("/api/clients")
    assert res.status_code == 200
    clients = res.json()
    assert len(clients) >= 3

    # Check Naledi overview
    ov = client.get("/api/clients/1/overview")
    assert ov.status_code == 200
    data = ov.json()
    assert data["name"] == "Naledi Mokoena"
    assert data["compliance_state"]["identity_verified"] is True
    assert len(data["goals"]) == 3


def test_adviser_dashboard():
    res = client.get("/api/advisers/1/dashboard")
    assert res.status_code == 200
    dash = res.json()
    assert "summary_counts" in dash
    assert "needs_attention" in dash
    assert "waiting_on_provider" in dash
    assert "compliance_exceptions" in dash
    assert len(dash["compliance_exceptions"]) >= 1


def test_banking_prefill():
    res = client.get("/api/cases/1/forms/banking-instruction/prefill")
    assert res.status_code == 200
    data = res.json()
    assert data["client_name"] == "Naledi Mokoena"
    assert "Standard Bank" in data["bank"]
    assert data["statement_age_days"] == 17


def test_step_completion_and_audit():
    # Complete step 5 on Case 1
    res = client.post("/api/cases/1/steps/5/complete?actor=adviser:qiniso_ntuli")
    assert res.status_code == 200
    case_data = res.json()
    assert case_data["current_step"] == "provider_submission"
    assert case_data["status"] == "waiting on provider"


def test_provider_adapter():
    res = client.post(
        "/provider/banking-details",
        json={
            "client_name": "Naledi Mokoena",
            "id_number": "8804155028087",
            "bank_name": "Standard Bank",
            "account_number": "10192837465",
            "branch_code": "051001",
        },
    )
    assert res.status_code == 200
    assert res.json()["status"] == "accepted"
    assert res.json()["providerReference"] == "RSF-MOCK-2841"
