"""Verification script for Royal Square Portal schema, relationships, and seeded data."""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
if sys.platform == "win32" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.database.config import SessionLocal
from src.database.enums import CaseType, WorkflowStepOwner, EvidenceType
from src.database.models import (
    Adviser,
    Client,
    Goal,
    Case,
    WorkflowStep,
    Evidence,
    FormDefinition,
    FormSubmission,
    AuditEvent,
    ComplianceState,
)


def verify_all():
    db = SessionLocal()
    try:
        print("1. Verifying Adviser...")
        qiniso = db.query(Adviser).filter_by(name="Qiniso Ntuli").first()
        assert qiniso is not None, "Qiniso Ntuli not found!"
        assert len(qiniso.clients) == 3, f"Expected 3 clients, got {len(qiniso.clients)}"
        assert len(qiniso.cases) == 5, f"Expected 5 cases assigned to adviser, got {len(qiniso.cases)}"
        print(f"  ✓ Adviser: {qiniso.name} ({qiniso.email}) has {len(qiniso.clients)} clients.")

        print("2. Verifying Client 1: Naledi Mokoena...")
        naledi = db.query(Client).filter_by(name="Naledi Mokoena").first()
        assert naledi is not None, "Naledi Mokoena not found!"
        assert naledi.adviser == qiniso, "Naledi's adviser relationship mismatch"
        
        # Compliance state check
        comp = naledi.compliance_state
        assert comp is not None, "Naledi compliance state missing!"
        assert all([
            comp.identity_verified,
            comp.consent_valid,
            comp.pep_screening_clear,
            comp.documents_complete,
            comp.instruction_recorded,
            comp.disclosure_delivered,
            comp.audit_trail_ready,
        ]), "Naledi compliance state is not fully clear!"
        print("  ✓ Naledi Mokoena: All 7 ComplianceState booleans are True.")

        # Goals check
        assert len(naledi.goals) == 3, f"Expected 3 goals for Naledi, got {len(naledi.goals)}"
        goal_map = {g.name: (float(g.current_amount) / float(g.target_amount)) for g in naledi.goals}
        print(f"  ✓ Goals: {goal_map}")
        assert any(abs(pct - 0.74) < 0.01 for pct in goal_map.values()), "Home deposit at 74% missing"
        assert any(abs(pct - 1.00) < 0.01 for pct in goal_map.values()), "Emergency fund at 100% missing"

        # Active banking details change case
        bank_case = db.query(Case).filter_by(client_id=naledi.id, case_type=CaseType.BANK_DETAILS_CHANGE).first()
        assert bank_case is not None, "Naledi bank details change case missing!"
        assert bank_case.status == "adviser_review"
        assert bank_case.current_step == "adviser_review"
        assert len(bank_case.workflow_steps) == 7, f"Expected 7 workflow steps, got {len(bank_case.workflow_steps)}"
        assert len(bank_case.evidence) == 1, "Bank statement evidence missing"
        assert bank_case.evidence[0].type == EvidenceType.BANK_STATEMENT
        assert bank_case.evidence[0].extracted_data["statement_age_days"] < 90
        assert len(bank_case.audit_events) >= 6, "Expected chronological audit events on banking case"
        print(f"  ✓ Naledi Banking Case: at '{bank_case.current_step}', {len(bank_case.workflow_steps)} steps, {len(bank_case.audit_events)} audit events.")

        # Upcoming annual review case
        naledi_annual = db.query(Case).filter_by(client_id=naledi.id, case_type=CaseType.ANNUAL_REVIEW).first()
        assert naledi_annual is not None, "Naledi upcoming annual review missing"
        assert naledi_annual.status == "scheduled"
        print("  ✓ Naledi Upcoming Annual Review: scheduled.")

        print("3. Verifying Client 2: Sipho Dlamini...")
        sipho = db.query(Client).filter_by(name="Sipho Dlamini").first()
        assert sipho is not None, "Sipho Dlamini not found!"
        assert sipho.compliance_state.documents_complete is False, "Sipho documents_complete should be False (incomplete evidence)"

        accident_case = db.query(Case).filter_by(client_id=sipho.id, case_type=CaseType.MOTOR_ACCIDENT).first()
        assert accident_case is not None, "Sipho motor accident case missing!"
        assert accident_case.current_step == "evidence_collection"
        
        evidence_types = {e.type for e in accident_case.evidence}
        print(f"  ✓ Sipho Evidence types present: {[t.value for t in evidence_types]}")
        assert EvidenceType.SCENE_PHOTO in evidence_types
        assert EvidenceType.LOCATION in evidence_types
        assert EvidenceType.VOICE_STATEMENT in evidence_types
        assert EvidenceType.WITNESS_DETAILS not in evidence_types, "Witness details should be missing to demonstrate incomplete evidence state!"
        assert len(accident_case.audit_events) >= 6, "Expected audit events for accident case"
        print(f"  ✓ Motor Accident Case: {len(accident_case.evidence)} evidence items, witness missing, audit trail present.")

        print("4. Verifying Client 3: Thandi Khumalo...")
        thandi = db.query(Client).filter_by(name="Thandi Khumalo").first()
        assert thandi is not None, "Thandi Khumalo not found!"
        
        # Case waiting on provider
        provider_case = db.query(Case).filter_by(client_id=thandi.id, status="waiting on provider").first()
        assert provider_case is not None, "Thandi case with status 'waiting on provider' missing!"
        assert len(provider_case.audit_events) >= 4, "Expected audit events for provider case"
        print("  ✓ Thandi: Case with status 'waiting on provider' confirmed.")

        # Completed annual review case
        completed_review = db.query(Case).filter_by(client_id=thandi.id, case_type=CaseType.ANNUAL_REVIEW, status="completed").first()
        assert completed_review is not None, "Thandi completed annual review missing!"
        assert completed_review.current_step == "completed"
        print("  ✓ Thandi: Completed annual review confirmed.")

        print("5. Verifying FormDefinitions & Submissions...")
        form_defs = db.query(FormDefinition).all()
        assert len(form_defs) >= 4, f"Expected at least 4 form definitions, got {len(form_defs)}"
        submissions = db.query(FormSubmission).all()
        assert len(submissions) >= 3, f"Expected at least 3 form submissions, got {len(submissions)}"
        print(f"  ✓ {len(form_defs)} FormDefinitions and {len(submissions)} FormSubmissions present.")

        print("6. Verifying AuditEvents across all cases...")
        all_audits = db.query(AuditEvent).all()
        assert len(all_audits) >= 20, f"Expected at least 20 audit events, got {len(all_audits)}"
        # Check metadata access
        for event in all_audits[:5]:
            assert isinstance(event.metadata, dict)
            assert isinstance(event.metadata_, dict)
            assert "action" in event.to_dict()
        print(f"  ✓ {len(all_audits)} total AuditEvents verified with valid metadata JSON payloads.")

        print("7. Verifying JSON Serialization (to_dict)...")
        for model_cls in [Adviser, Client, Goal, Case, WorkflowStep, Evidence, FormDefinition, FormSubmission, AuditEvent, ComplianceState]:
            item = db.query(model_cls).first()
            d = item.to_dict()
            assert isinstance(d, dict), f"{model_cls.__name__}.to_dict() did not return a dictionary!"
            assert "id" in d, f"{model_cls.__name__}.to_dict() missing 'id'!"
        print("  ✓ to_dict() verified across all 10 entities.")

        print("\n=======================================================")
        print("🎉 ALL 7 VERIFICATION CRITERIA PASSED WITHOUT ERRORS!")
        print("=======================================================")

    finally:
        db.close()


if __name__ == "__main__":
    verify_all()
