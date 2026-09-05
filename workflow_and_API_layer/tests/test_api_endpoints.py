import pytest
from fastapi.testclient import TestClient


def test_health_check_endpoint(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "Backend A - Workflow & API Orchestrator"


def test_client_profile_and_overview(client: TestClient):
    # GET client profile
    res1 = client.get("/api/v1/clients/cli-001")
    assert res1.status_code == 200
    data1 = res1.json()
    assert data1["name"] == "Naledi Mokoena"
    assert data1["compliance_clear"] is True

    # GET client overview
    res2 = client.get("/api/v1/clients/cli-001/overview")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["financial_overview"]["net_worth"] > 0
    assert len(data2["goals"]) == 3


def test_case_lifecycle_api(client: TestClient):
    # 1. POST /api/cases -> create case
    payload = {
        "client_id": "cli-001",
        "adviser_id": "adv-001",
        "case_type": "bank_details_change",
        "priority": "high",
        "metadata_json": {"source": "mobile_app"}
    }
    create_res = client.post("/api/cases", json=payload)
    assert create_res.status_code == 201
    case_data = create_res.json()
    case_id = case_data["id"]
    assert case_data["current_state"] == "bank_statement_required"

    # 2. GET /api/cases/{id}
    get_res = client.get(f"/api/cases/{case_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == case_id
    assert len(get_res.json()["steps"]) == 7

    # 3. POST /api/cases/{id}/steps/{step_id}/complete
    step_payload = {
        "actor": "client",
        "input_data": {"evidence_id": "evi-123"}
    }
    advance_res = client.post(
        f"/api/cases/{case_id}/steps/bank_statement_required/complete",
        json=step_payload
    )
    assert advance_res.status_code == 200
    assert advance_res.json()["new_state"] == "bank_statement_validation"

    # 4. Test invalid transition error
    invalid_step_payload = {
        "actor": "client",
        "input_data": {}
    }
    # Trying to advance adviser_review step while in validation
    err_res = client.post(
        f"/api/cases/{case_id}/steps/adviser_review/complete",
        json=invalid_step_payload
    )
    assert err_res.status_code == 400

    # 5. GET /api/advisers/{id}/dashboard
    dash_res = client.get("/api/advisers/adv-001/dashboard")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["adviser_id"] == "adv-001"
    assert "triage" in dash_data

    # 6. GET /api/cases/{id}/audit
    audit_res = client.get(f"/api/cases/{case_id}/audit")
    assert audit_res.status_code == 200
    audit_data = audit_res.json()
    assert audit_data["total_events"] >= 3
