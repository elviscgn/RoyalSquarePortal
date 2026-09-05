import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure database layer is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.main import app
from src.database.config import SessionLocal, engine, Base
from src.database.models import Client, Case, Evidence, FormDefinition, FormSubmission
from src.database.enums import EvidenceType, CaseType

client = TestClient(app)


def test_root_and_health():
    """Verify application health and database connection."""
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

    health = client.get("/api/health")
    assert health.status_code == 200
    assert health.json()["status"] == "healthy"


# =============================================================================
# Milestone 1: Banking Details Change Flow Tests
# =============================================================================

def test_evidence_upload_for_case():
    """1. Upload bank statement: POST /api/cases/:caseId/evidence"""
    payload = {
        "type": "bank_statement",
        "file": "https://storage.royalsquare.co.za/evidence/test_bank_statement.pdf",
        "extracted_data": {
            "bank_name": "Standard Bank South Africa",
            "account_holder": "Naledi Mokoena",
            "account_number": "10192837465",
            "branch_code": "051001",
            "statement_date": "2026-08-19",
            "statement_age_days": 17,
        },
        "location": "Sandton, Johannesburg",
    }
    res = client.post("/api/cases/1/evidence", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["type"] == "bank_statement"
    assert data["case_id"] == 1
    assert data["client_id"] == 1
    assert data["extracted_data"]["statement_age_days"] == 17


def test_bank_statement_validation_pass():
    """2. Validate statement: Statement age <= 90 days must PASS."""
    # First upload an evidence record with age 17 days
    upload_res = client.post(
        "/api/cases/1/evidence",
        json={
            "type": "bank_statement",
            "file": "https://storage.royalsquare.co.za/evidence/valid_statement.pdf",
            "extracted_data": {
                "bank_name": "Standard Bank South Africa",
                "account_holder": "Naledi Mokoena",
                "account_number": "10192837465",
                "branch_code": "051001",
                "statement_age_days": 17,
            },
        },
    )
    assert upload_res.status_code == 201
    evidence_id = upload_res.json()["id"]

    # Validate
    val_res = client.post(f"/api/evidence/{evidence_id}/validate")
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["valid/invalid"] == "valid"
    assert val_data["validation_state"] == "valid"
    assert val_data["is_valid"] is True
    assert val_data["age_in_days"] == 17
    assert "90-day" in val_data["reason"]


def test_bank_statement_validation_fail_old_statement():
    """3. Validate statement rejection: Statement age > 90 days must FAIL."""
    # Upload an old statement with age 105 days
    upload_res = client.post(
        "/api/cases/1/evidence",
        json={
            "type": "bank_statement",
            "file": "https://storage.royalsquare.co.za/evidence/old_statement.pdf",
            "extracted_data": {
                "bank_name": "Standard Bank South Africa",
                "account_holder": "Naledi Mokoena",
                "account_number": "10192837465",
                "statement_age_days": 105,
            },
        },
    )
    assert upload_res.status_code == 201
    evidence_id = upload_res.json()["id"]

    # Validate
    val_res = client.post(f"/api/evidence/{evidence_id}/validate")
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["valid/invalid"] == "invalid"
    assert val_data["validation_state"] == "invalid"
    assert val_data["is_valid"] is False
    assert val_data["age_in_days"] == 105
    assert "REJECTED" in val_data["reason"] or "exceeds" in val_data["reason"]


def test_banking_form_prefill():
    """4. Banking form prefill: GET /api/cases/:caseId/forms/banking-instruction/prefill"""
    res = client.get("/api/cases/1/forms/banking-instruction/prefill")
    assert res.status_code == 200
    data = res.json()
    assert data["client_name"] == "Naledi Mokoena"
    assert data["id_number"] == "8804155028087"
    assert data["email"] == "naledi.mokoena@vodamail.co.za"
    assert "Standard Bank" in data["bank"]
    assert data["account_number"] == "10192837465"
    assert data["statement_age_days"] <= 90


def test_form_submission_lifecycle_and_signature():
    """5. Form submission & digital signature lifecycle."""
    # Initialize submission
    sub_payload = {
        "case_id": 1,
        "form_version": "banking-details-instruction/v1.2",
        "answers": {
            "client_name": "Naledi Mokoena",
            "id_number": "8804155028087",
            "bank_name": "Standard Bank South Africa",
            "account_holder": "Naledi Mokoena",
            "account_number": "10192837465",
            "branch_code": "051001",
            "account_type": "Cheque",
        },
        "status": "draft",
    }
    create_res = client.post("/api/forms/banking-details-instruction/submissions", json=sub_payload)
    assert create_res.status_code == 201
    submission = create_res.json()
    submission_id = submission["id"]
    assert submission["status"] == "draft"

    # Patch with digital signature
    patch_res = client.patch(
        f"/api/form-submissions/{submission_id}",
        json={
            "signature": {
                "signed": True,
                "signer_name": "Naledi Mokoena",
                "method": "digital_signature_pad",
                "signer_ip": "196.25.1.14",
                "device": "Mobile Safari (iPhone 15 Pro)",
            }
        },
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["signature"]["signed"] is True

    # Finalize submit
    submit_res = client.post(f"/api/form-submissions/{submission_id}/submit")
    assert submit_res.status_code == 200
    final_data = submit_res.json()
    assert final_data["status"] == "submitted"
    assert final_data["generated_document"] is not None
    assert final_data["generated_document"].endswith(".pdf")


def test_mock_provider_banking_adapter():
    """6. Mock provider adapter: POST /provider/banking-details"""
    payload = {
        "client_name": "Naledi Mokoena",
        "id_number": "8804155028087",
        "bank_name": "Standard Bank",
        "account_number": "10192837465",
        "branch_code": "051001",
        "provider_brand": "Discovery",
    }
    res = client.post("/provider/banking-details", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "accepted"
    assert data["providerReference"] == "RSF-MOCK-2841"
    assert data["provider_brand"] == "Discovery"

    # Also test mounted /api/providers/banking-details
    res2 = client.post("/api/providers/banking-details", json=payload)
    assert res2.status_code == 200
    assert res2.json()["status"] == "accepted"


def test_mock_provider_claims_adapter():
    """Mock provider claims registration."""
    payload = {
        "case_id": 2,
        "client_id": 2,
        "policy_number": "POL-994812",
        "claim_type": "motor_accident",
        "provider_brand": "Old Mutual",
    }
    res = client.post("/provider/claims", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "accepted"
    assert data["providerReference"].startswith("RSF-CLM-")
    assert data["claimNumber"].startswith("DN-")


# =============================================================================
# Milestone 2: Reusable Form Definitions & Accident Mode Sync Tests
# =============================================================================

def test_all_five_form_definitions_available():
    """Verify all required form definitions are seeded and queryable."""
    required_forms = [
        "client-consent",
        "broker-appointment",
        "service-level-agreement",
        "confidentiality-agreement",
        "fais-disclosure",
        "banking-details-instruction",
    ]
    # List all
    list_res = client.get("/api/forms")
    assert list_res.status_code == 200
    all_forms = {f["id"]: f for f in list_res.json()}

    for form_id in required_forms:
        assert form_id in all_forms, f"Form '{form_id}' is missing from seeded definitions!"
        # Individual get
        single_res = client.get(f"/api/forms/{form_id}")
        assert single_res.status_code == 200
        assert len(single_res.json()["fields"]) > 0


def test_generic_form_prefill():
    """Dynamic profile prefilling for broker-appointment."""
    res = client.get("/api/cases/1/forms/broker-appointment/prefill")
    assert res.status_code == 200
    data = res.json()
    assert data["clientName"] == "Naledi Mokoena"
    assert data["idNumber"] == "8804155028087"
    assert data["adviserName"] == "Qiniso Ntuli"


def test_accident_mode_sync_with_all_evidence():
    """Accident Mode sync endpoint: POST /api/accidents/sync with complete evidence."""
    payload = {
        "client_id": 2,
        "latitude": -26.2041,
        "longitude": 28.0473,
        "gps_accuracy": 5.0,
        "statement": "Driving north on Commissioner St when a silver Toyota hit passenger door.",
        "other_driver_details": {
            "driver_name": "Tshepo Modise",
            "phone": "+27 83 999 1122",
            "license_plate": "CA 829-102",
            "vehicle": "Toyota Corolla (Silver)",
            "insurer": "Outsurance",
            "policy_number": "OUT-48190",
        },
        "witnesses": [
            {"name": "Sipho Mbele", "phone": "+27 72 111 2233", "notes": "Saw the silver Toyota run the red light"}
        ],
        "photo_urls": [
            "https://storage.royalsquare.co.za/evidence/accident/scene_wide_1.jpg",
            "https://storage.royalsquare.co.za/evidence/accident/vehicle_damage_1.jpg",
        ],
        "voice_note_url": "https://storage.royalsquare.co.za/evidence/accident/voice_memo_1.m4a",
    }
    res = client.post("/api/accidents/sync", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "in_progress"
    assert data["priority"] == "urgent"
    assert data["completeness_score"] == "100%"
    assert data["guidance_prompt"] is None
    assert data["evidence_count"] >= 5


def test_accident_mode_sync_missing_witness_guidance():
    """Accident Mode sync with missing witness returns guidance prompt."""
    payload = {
        "client_id": 2,
        "latitude": -26.2041,
        "longitude": 28.0473,
        "gps_accuracy": 6.5,
        "statement": "Hit stationary pole avoiding a dog.",
        "other_driver_details": None,
        "witnesses": [],
        "photo_urls": ["https://storage.royalsquare.co.za/evidence/accident/scene_2.jpg"],
    }
    res = client.post("/api/accidents/sync", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["completeness_score"] != "100%"
    assert "witness details" in data["guidance_prompt"].lower()


def test_evidence_completeness_endpoint():
    """GET /api/cases/:caseId/evidence/completeness endpoint."""
    # Motor accident case (Case 3)
    res_accident = client.get("/api/cases/3/evidence/completeness")
    assert res_accident.status_code == 200
    data_acc = res_accident.json()
    assert "completeness_score" in data_acc
    assert "checklist" in data_acc
    assert len(data_acc["checklist"]) == 6  # location, scene, vehicle, other driver, voice, witness

    # Banking details change case (Case 1)
    res_bank = client.get("/api/cases/1/evidence/completeness")
    assert res_bank.status_code == 200
    data_bank = res_bank.json()
    assert "completeness_score" in data_bank
    assert len(data_bank["checklist"]) == 3


def test_pdf_download_endpoint():
    """GET /api/form-submissions/:id/pdf generates and streams real PDF."""
    res = client.get("/api/form-submissions/1/pdf")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 500  # valid non-empty PDF binary
    assert res.content[:4] == b"%PDF"  # standard PDF header magic bytes
