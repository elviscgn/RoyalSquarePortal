"""Royal Square Portal - Seed Script
Seeds realistic South African wealth management data for:
- Adviser: Qiniso Ntuli
- Client 1: Naledi Mokoena (Compliance clear, banking_details_change case at adviser_review, upcoming annual_review, 3 goals)
- Client 2: Sipho Dlamini (motor_accident case at evidence_collection, photos + GPS + voice statement present, witness missing)
- Client 3: Thandi Khumalo (beneficiary_change case waiting on provider, completed annual_review case)
- Standard FormDefinitions
- Chronological AuditEvents across all cases
"""

import sys
import os
from datetime import datetime, timezone, timedelta
from decimal import Decimal

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database.config import SessionLocal, Base, engine
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


from sqlalchemy import text

def seed_database():
    db = SessionLocal()
    try:
        print("--- Clearing and resetting database tables ---")
        # In PostgreSQL, TRUNCATE ... RESTART IDENTITY CASCADE cleanly resets auto-increment sequences to 1
        db.execute(
            text(
                "TRUNCATE TABLE advisers, clients, goals, cases, workflow_steps, "
                "evidence, form_definitions, form_submissions, audit_events, compliance_states "
                "RESTART IDENTITY CASCADE;"
            )
        )
        db.commit()

        print("--- Seeding FormDefinitions ---")
        form_definitions = [
            FormDefinition(
                id="banking-details-instruction",
                title="Notice of Banking Details Change Instruction",
                version="v1.2",
                fields=[
                    {"key": "client_name", "type": "text", "label": "Full Name", "source": "client.name", "read_only": True},
                    {"key": "id_number", "type": "text", "label": "RSA ID Number", "source": "client.id_number", "read_only": True},
                    {"key": "bank_name", "type": "text", "label": "Bank Name", "required": True},
                    {"key": "account_holder", "type": "text", "label": "Account Holder", "required": True},
                    {"key": "account_number", "type": "text", "label": "Account Number", "required": True},
                    {"key": "branch_code", "type": "text", "label": "Branch Code", "required": True},
                    {"key": "account_type", "type": "select", "options": ["Cheque", "Savings", "Transmission"], "required": True},
                    {"key": "signature", "type": "signature", "label": "Digital Signature / Acknowledgment", "required": True},
                    {"key": "date", "type": "date", "label": "Date Signed", "required": True},
                ],
                validation_rules={
                    "bank_statement_max_age_days": 90,
                    "require_identity_match": True,
                    "supported_banks": ["Standard Bank", "First National Bank", "Nedbank", "ABSA", "Capitec", "Investec"],
                },
                profile_mappings={
                    "client_name": "name",
                    "id_number": "id_number",
                    "email": "email",
                    "mobile": "mobile",
                },
            ),
            FormDefinition(
                id="broker-appointment",
                title="Notice of Appointment as Financial Adviser",
                version="v2.0",
                fields=[
                    {"key": "clientName", "type": "text", "label": "Client Full Name", "source": "client.name"},
                    {"key": "idNumber", "type": "text", "label": "Identity Number", "source": "client.id_number"},
                    {"key": "address", "type": "textarea", "label": "Physical Address", "source": "client.address"},
                    {"key": "mobile", "type": "tel", "label": "Mobile Phone", "source": "client.mobile"},
                    {"key": "email", "type": "email", "label": "Email Address", "source": "client.email"},
                    {"key": "adviserName", "type": "text", "label": "Appointed Adviser", "source": "adviser.name"},
                    {"key": "signature", "type": "signature", "label": "Client Signature"},
                    {"key": "date", "type": "date", "label": "Date"},
                ],
                validation_rules={"require_signature": True, "fais_compliant": True},
                profile_mappings={"clientName": "name", "idNumber": "id_number", "address": "address"},
            ),
            FormDefinition(
                id="client-consent",
                title="POPIA Information Processing & Access Consent",
                version="v1.0",
                fields=[
                    {"key": "client_name", "type": "text", "label": "Client Name", "source": "client.name"},
                    {"key": "id_number", "type": "text", "label": "RSA ID", "source": "client.id_number"},
                    {"key": "purpose", "type": "text", "default": "Financial advisory, risk planning, and provider transaction servicing"},
                    {"key": "consent_opt_in", "type": "checkbox", "label": "I consent to processing for financial advisory services", "required": True},
                    {"key": "signature", "type": "signature", "required": True},
                ],
                validation_rules={"consent_mandatory": True, "retention_policy_accepted": True},
                profile_mappings={"client_name": "name", "id_number": "id_number"},
            ),
            FormDefinition(
                id="fais-disclosure",
                title="FAIS Statutory Disclosure & Conflict of Interest Declaration",
                version="v1.1",
                fields=[
                    {"key": "fsp_name", "type": "text", "default": "Royal Square Financial Services (Pty) Ltd"},
                    {"key": "fsp_license_number", "type": "text", "default": "FSP 49281"},
                    {"key": "adviser_name", "type": "text", "source": "adviser.name"},
                    {"key": "professional_indemnity_confirmed", "type": "checkbox", "default": True},
                    {"key": "client_acknowledgement", "type": "checkbox", "required": True},
                    {"key": "signature", "type": "signature", "required": True},
                ],
                validation_rules={"statutory_notice_acknowledged": True},
                profile_mappings={"adviser_name": "adviser.name"},
            ),
        ]
        db.add_all(form_definitions)
        db.commit()

        print("--- Seeding Adviser: Qiniso Ntuli ---")
        qiniso = Adviser(
            name="Qiniso Ntuli",
            email="qiniso@royalsquare.co.za",
        )
        db.add(qiniso)
        db.flush()

        base_time = datetime.now(timezone.utc)

        # =====================================================================
        # CLIENT 1: Naledi Mokoena
        # =====================================================================
        print("--- Seeding Client 1: Naledi Mokoena ---")
        naledi = Client(
            name="Naledi Mokoena",
            id_number="8804155028087",
            address="74 Rivonia Road, Sandhurst, Sandton, 2196",
            mobile="+27 82 555 1842",
            email="naledi.mokoena@vodamail.co.za",
            adviser_id=qiniso.id,
            financial_position={
                "net_worth": 2450000.00,
                "assets": {
                    "primary_residence": 1800000.00,
                    "vehicle": 250000.00,
                    "savings_account": 100000.00,
                },
                "liabilities": {
                    "home_loan": 1100000.00,
                    "credit_card": 15000.00,
                },
                "investments": {
                    "tax_free_savings": 220000.00,
                    "unit_trusts": 350000.00,
                },
                "insurance": {
                    "life_cover": 3000000.00,
                    "dread_disease": 750000.00,
                    "disability": 1500000.00,
                },
                "retirement": {
                    "retirement_annuity": 780000.00,
                    "preservation_fund": 450000.00,
                },
            },
            consent_state="granted",
            consent_version="v1.0",
            consent_timestamp=base_time - timedelta(days=120),
            consent_revoked=False,
            retention_status="active",
            deletion_request_state="none",
            created_at=base_time - timedelta(days=120),
            updated_at=base_time - timedelta(hours=2),
        )
        db.add(naledi)
        db.flush()

        # Compliance State: All true
        naledi_compliance = ComplianceState(
            client_id=naledi.id,
            identity_verified=True,
            consent_valid=True,
            pep_screening_clear=True,
            documents_complete=True,
            instruction_recorded=True,
            disclosure_delivered=True,
            audit_trail_ready=True,
        )
        db.add(naledi_compliance)

        # 3 Seeded Goals with varied progress
        naledi_goals = [
            Goal(
                client_id=naledi.id,
                name="Home Deposit",
                target_amount=Decimal("500000.00"),
                current_amount=Decimal("370000.00"),  # 74%
                status="on_track",
            ),
            Goal(
                client_id=naledi.id,
                name="Emergency Fund",
                target_amount=Decimal("100000.00"),
                current_amount=Decimal("100000.00"),  # 100%
                status="complete",
            ),
            Goal(
                client_id=naledi.id,
                name="Retirement Annuity Expansion",
                target_amount=Decimal("1500000.00"),
                current_amount=Decimal("780000.00"),  # 52%
                status="on_track",
            ),
        ]
        db.add_all(naledi_goals)

        # Case 1: Active bank_details_change at adviser_review step
        naledi_bank_case = Case(
            client_id=naledi.id,
            adviser_id=qiniso.id,
            case_type=CaseType.BANK_DETAILS_CHANGE,
            status="adviser_review",
            priority="high",
            current_step="adviser_review",
            created_at=base_time - timedelta(days=2),
            updated_at=base_time - timedelta(hours=1),
        )
        db.add(naledi_bank_case)
        db.flush()

        # WorkflowSteps for Banking Details Change
        naledi_steps = [
            WorkflowStep(
                case_id=naledi_bank_case.id,
                key="request_received",
                title="Client Request Received via Portal",
                owner=WorkflowStepOwner.CLIENT,
                status="completed",
                order=1,
                required_evidence="client_intent",
                due_date=base_time - timedelta(days=2),
                completion_timestamp=base_time - timedelta(days=2),
            ),
            WorkflowStep(
                case_id=naledi_bank_case.id,
                key="bank_statement_required",
                title="Upload Latest Bank Statement (< 3 Months Old)",
                owner=WorkflowStepOwner.CLIENT,
                status="completed",
                order=2,
                required_evidence="bank_statement",
                due_date=base_time - timedelta(days=1),
                completion_timestamp=base_time - timedelta(days=1, hours=4),
            ),
            WorkflowStep(
                case_id=naledi_bank_case.id,
                key="bank_statement_validation",
                title="Automated Document Extraction & Age Validation",
                owner=WorkflowStepOwner.SYSTEM,
                status="completed",
                order=3,
                required_evidence="bank_statement",
                due_date=base_time - timedelta(days=1),
                completion_timestamp=base_time - timedelta(days=1, hours=3, minutes=58),
            ),
            WorkflowStep(
                case_id=naledi_bank_case.id,
                key="bank_instruction_form",
                title="Review Pre-filled Banking Instruction & Sign",
                owner=WorkflowStepOwner.CLIENT,
                status="completed",
                order=4,
                required_evidence="form_submission",
                due_date=base_time - timedelta(hours=12),
                completion_timestamp=base_time - timedelta(hours=3),
            ),
            WorkflowStep(
                case_id=naledi_bank_case.id,
                key="adviser_review",
                title="Adviser Exception & Authorization Review",
                owner=WorkflowStepOwner.ADVISER,
                status="in_progress",
                order=5,
                required_evidence=None,
                due_date=base_time + timedelta(hours=24),
                completion_timestamp=None,
            ),
            WorkflowStep(
                case_id=naledi_bank_case.id,
                key="provider_submission",
                title="Submit Instruction to Product Provider (Discovery / Old Mutual)",
                owner=WorkflowStepOwner.PROVIDER,
                status="pending",
                order=6,
                required_evidence="provider_confirmation",
                due_date=base_time + timedelta(days=2),
                completion_timestamp=None,
            ),
            WorkflowStep(
                case_id=naledi_bank_case.id,
                key="completed",
                title="Confirmation & Case Archival",
                owner=WorkflowStepOwner.SYSTEM,
                status="pending",
                order=7,
                required_evidence=None,
                due_date=base_time + timedelta(days=3),
                completion_timestamp=None,
            ),
        ]
        db.add_all(naledi_steps)

        # Evidence: Bank Statement (17 days old, valid)
        naledi_evidence = Evidence(
            client_id=naledi.id,
            case_id=naledi_bank_case.id,
            type=EvidenceType.BANK_STATEMENT,
            file="https://storage.royalsquare.co.za/evidence/clients/naledi_mokoena_std_bank_stmt.pdf",
            extracted_data={
                "bank_name": "Standard Bank South Africa",
                "account_holder": "Ms Naledi Mokoena",
                "account_number": "10192837465",
                "branch_code": "051001",
                "account_type": "Cheque Account",
                "statement_date": (base_time - timedelta(days=17)).strftime("%Y-%m-%d"),
                "statement_age_days": 17,
                "is_stamped": True,
                "confidence_score": 0.99,
                "validation_checks": {
                    "age_under_90_days": True,
                    "account_holder_matches_client": True,
                    "id_number_verified": True,
                },
            },
            validation_state="valid",
            timestamp=base_time - timedelta(days=1, hours=4),
            location="Sandton, Johannesburg (Lat: -26.1076, Lng: 28.0567)",
        )
        db.add(naledi_evidence)

        # FormSubmission: Signed Banking Details Instruction
        naledi_submission = FormSubmission(
            client_id=naledi.id,
            case_id=naledi_bank_case.id,
            form_version="banking-details-instruction/v1.2",
            answers={
                "client_name": "Naledi Mokoena",
                "id_number": "8804155028087",
                "bank_name": "Standard Bank South Africa",
                "account_holder": "Ms Naledi Mokoena",
                "account_number": "10192837465",
                "branch_code": "051001",
                "account_type": "Cheque",
                "effective_date": base_time.strftime("%Y-%m-%d"),
                "declaration": "I certify that the above account is in my name and all debit orders/premiums may be drawn herefrom.",
            },
            signature={
                "signed": True,
                "method": "digital_signature_pad",
                "signer_name": "Naledi Mokoena",
                "signer_ip": "196.25.1.14",
                "device": "Mobile Safari (iPhone 15 Pro)",
                "timestamp": (base_time - timedelta(hours=3)).isoformat(),
            },
            submitted_timestamp=base_time - timedelta(hours=3),
            status="submitted",
            generated_document="https://storage.royalsquare.co.za/documents/naledi_banking_instruction_signed.pdf",
        )
        db.add(naledi_submission)

        # AuditEvents for Naledi's Banking Details Change
        naledi_audit = [
            AuditEvent(
                actor="client:naledi_mokoena",
                action="case.created",
                timestamp=base_time - timedelta(days=2),
                case_id=naledi_bank_case.id,
                metadata={
                    "channel": "mobile_app",
                    "intent": "I changed banks",
                    "source": "client_portal",
                },
            ),
            AuditEvent(
                actor="client:naledi_mokoena",
                action="document.uploaded",
                timestamp=base_time - timedelta(days=1, hours=4),
                case_id=naledi_bank_case.id,
                metadata={
                    "document_type": "bank_statement",
                    "file_name": "naledi_mokoena_std_bank_stmt.pdf",
                    "size_bytes": 482910,
                },
            ),
            AuditEvent(
                actor="system:ocr_pipeline",
                action="bank_statement.validated",
                timestamp=base_time - timedelta(days=1, hours=3, minutes=58),
                case_id=naledi_bank_case.id,
                metadata={
                    "statement_age_days": 17,
                    "bank_detected": "Standard Bank",
                    "account_match": True,
                    "result": "PASS",
                },
            ),
            AuditEvent(
                actor="client:naledi_mokoena",
                action="form.prefilled",
                timestamp=base_time - timedelta(hours=3, minutes=15),
                case_id=naledi_bank_case.id,
                metadata={
                    "form_key": "banking-details-instruction",
                    "prefilled_fields": ["client_name", "id_number", "bank_name", "account_number", "branch_code"],
                },
            ),
            AuditEvent(
                actor="client:naledi_mokoena",
                action="client.signed",
                timestamp=base_time - timedelta(hours=3),
                case_id=naledi_bank_case.id,
                metadata={
                    "signature_type": "biometric_touch_ack",
                    "ip_address": "196.25.1.14",
                },
            ),
            AuditEvent(
                actor="client:naledi_mokoena",
                action="form.submitted",
                timestamp=base_time - timedelta(hours=3),
                case_id=naledi_bank_case.id,
                metadata={
                    "submission_id": 1,
                    "pdf_generated": "naledi_banking_instruction_signed.pdf",
                },
            ),
            AuditEvent(
                actor="system:workflow_engine",
                action="workflow.step_advanced",
                timestamp=base_time - timedelta(hours=3),
                case_id=naledi_bank_case.id,
                metadata={
                    "completed_step": "bank_instruction_form",
                    "current_step": "adviser_review",
                    "assigned_to": "qiniso@royalsquare.co.za",
                },
            ),
        ]
        db.add_all(naledi_audit)

        # Case 2: Upcoming Annual Review Case for Naledi
        naledi_review_case = Case(
            client_id=naledi.id,
            adviser_id=qiniso.id,
            case_type=CaseType.ANNUAL_REVIEW,
            status="scheduled",
            priority="normal",
            current_step="preparation",
            created_at=base_time - timedelta(days=5),
            updated_at=base_time - timedelta(days=1),
        )
        db.add(naledi_review_case)
        db.flush()

        naledi_review_steps = [
            WorkflowStep(
                case_id=naledi_review_case.id,
                key="review_notification_sent",
                title="Notify Client: Annual Financial Planning Review Due in 30 Days",
                owner=WorkflowStepOwner.SYSTEM,
                status="completed",
                order=1,
                due_date=base_time - timedelta(days=5),
                completion_timestamp=base_time - timedelta(days=5),
            ),
            WorkflowStep(
                case_id=naledi_review_case.id,
                key="client_circumstance_check",
                title="Client Confirms Any Change in Financial Circumstances",
                owner=WorkflowStepOwner.CLIENT,
                status="completed",
                order=2,
                due_date=base_time - timedelta(days=1),
                completion_timestamp=base_time - timedelta(days=1),
            ),
            WorkflowStep(
                case_id=naledi_review_case.id,
                key="adviser_portfolio_pack",
                title="Compile Comprehensive Wealth Review Pack & Valuations",
                owner=WorkflowStepOwner.ADVISER,
                status="in_progress",
                order=3,
                due_date=base_time + timedelta(days=14),
                completion_timestamp=None,
            ),
            WorkflowStep(
                case_id=naledi_review_case.id,
                key="consultation_held",
                title="Review Consultation Session (In-Person / Google Meet)",
                owner=WorkflowStepOwner.ADVISER,
                status="pending",
                order=4,
                due_date=base_time + timedelta(days=21),
                completion_timestamp=None,
            ),
        ]
        db.add_all(naledi_review_steps)

        naledi_review_audit = [
            AuditEvent(
                actor="system:scheduler",
                action="case.created",
                timestamp=base_time - timedelta(days=5),
                case_id=naledi_review_case.id,
                metadata={"trigger": "annual_anniversary_rule", "scheduled_month": "October 2026"},
            ),
            AuditEvent(
                actor="system:notification_engine",
                action="notification.dispatched",
                timestamp=base_time - timedelta(days=5),
                case_id=naledi_review_case.id,
                metadata={"channel": "email_and_sms", "recipient": naledi.email},
            ),
            AuditEvent(
                actor="client:naledi_mokoena",
                action="circumstances.confirmed",
                timestamp=base_time - timedelta(days=1),
                case_id=naledi_review_case.id,
                metadata={"status": "no_major_dependant_changes", "salary_increase": True},
            ),
        ]
        db.add_all(naledi_review_audit)

        # =====================================================================
        # CLIENT 2: Sipho Dlamini
        # =====================================================================
        print("--- Seeding Client 2: Sipho Dlamini ---")
        sipho = Client(
            name="Sipho Dlamini",
            id_number="9209125134081",
            address="15 Oxford Road, Rosebank, Johannesburg, 2196",
            mobile="+27 71 884 9201",
            email="sipho.dlamini@outlook.com",
            adviser_id=qiniso.id,
            financial_position={
                "net_worth": 890000.00,
                "assets": {
                    "vehicle": 320000.00,
                    "savings": 45000.00,
                },
                "liabilities": {
                    "vehicle_finance": 180000.00,
                },
                "investments": {
                    "unit_trusts": 95000.00,
                },
                "insurance": {
                    "comprehensive_motor": 350000.00,
                    "life_cover": 1000000.00,
                },
                "retirement": {
                    "pension_fund": 610000.00,
                },
            },
            consent_state="granted",
            consent_version="v1.0",
            consent_timestamp=base_time - timedelta(days=90),
            consent_revoked=False,
            retention_status="active",
            deletion_request_state="none",
            created_at=base_time - timedelta(days=90),
            updated_at=base_time - timedelta(hours=4),
        )
        db.add(sipho)
        db.flush()

        # Sipho Compliance: documents_complete is False because witness evidence is missing
        sipho_compliance = ComplianceState(
            client_id=sipho.id,
            identity_verified=True,
            consent_valid=True,
            pep_screening_clear=True,
            documents_complete=False,  # Incomplete evidence state
            instruction_recorded=True,
            disclosure_delivered=True,
            audit_trail_ready=True,
        )
        db.add(sipho_compliance)

        sipho_goals = [
            Goal(
                client_id=sipho.id,
                name="Settle Vehicle Finance Early",
                target_amount=Decimal("180000.00"),
                current_amount=Decimal("65000.00"),  # 36%
                status="in_progress",
            ),
            Goal(
                client_id=sipho.id,
                name="Emergency Savings Buffer",
                target_amount=Decimal("80000.00"),
                current_amount=Decimal("45000.00"),  # 56%
                status="in_progress",
            ),
        ]
        db.add_all(sipho_goals)

        # Sipho Motor Accident Case (offline capture synced)
        sipho_accident_case = Case(
            client_id=sipho.id,
            adviser_id=qiniso.id,
            case_type=CaseType.MOTOR_ACCIDENT,
            status="in_progress",
            priority="urgent",
            current_step="evidence_collection",
            created_at=base_time - timedelta(hours=4),
            updated_at=base_time - timedelta(minutes=45),
        )
        db.add(sipho_accident_case)
        db.flush()

        # WorkflowSteps for Motor Accident
        sipho_steps = [
            WorkflowStep(
                case_id=sipho_accident_case.id,
                key="incident_captured",
                title="Accident Mode Incident Capture (GPS & Timestamp)",
                owner=WorkflowStepOwner.CLIENT,
                status="completed",
                order=1,
                required_evidence="location",
                due_date=base_time - timedelta(hours=4),
                completion_timestamp=base_time - timedelta(hours=3, minutes=50),
            ),
            WorkflowStep(
                case_id=sipho_accident_case.id,
                key="evidence_collection",
                title="Scene Evidence: Photos, Vehicle Damage, Voice Statement & Witnesses",
                owner=WorkflowStepOwner.CLIENT,
                status="in_progress",
                order=2,
                required_evidence="scene_photo,vehicle_photo,voice_statement,witness_details",
                due_date=base_time + timedelta(hours=12),
                completion_timestamp=None,
            ),
            WorkflowStep(
                case_id=sipho_accident_case.id,
                key="client_submission",
                title="Client Confirmation & Claim Lodgement Signature",
                owner=WorkflowStepOwner.CLIENT,
                status="pending",
                order=3,
                required_evidence="form_submission",
                due_date=base_time + timedelta(hours=24),
                completion_timestamp=None,
            ),
            WorkflowStep(
                case_id=sipho_accident_case.id,
                key="adviser_review",
                title="Adviser Claim Triage & Provider Escalation",
                owner=WorkflowStepOwner.ADVISER,
                status="pending",
                order=4,
                required_evidence=None,
                due_date=base_time + timedelta(hours=36),
                completion_timestamp=None,
            ),
            WorkflowStep(
                case_id=sipho_accident_case.id,
                key="claim_registration",
                title="Register Claim with Insurer (Discovery Insure)",
                owner=WorkflowStepOwner.PROVIDER,
                status="pending",
                order=5,
                required_evidence="provider_claim_number",
                due_date=base_time + timedelta(days=2),
                completion_timestamp=None,
            ),
        ]
        db.add_all(sipho_steps)

        # Evidence: Photos + GPS + Voice present, but witness_details MISSING
        sipho_evidence = [
            Evidence(
                client_id=sipho.id,
                case_id=sipho_accident_case.id,
                type=EvidenceType.LOCATION,
                file="device://telemetry/gps-packet-9412.json",
                extracted_data={
                    "latitude": -26.2041,
                    "longitude": 28.0473,
                    "accuracy_meters": 8.0,
                    "street": "Commissioner St & Harrison St",
                    "city": "Johannesburg",
                    "captured_offline": True,
                },
                validation_state="valid",
                timestamp=base_time - timedelta(hours=3, minutes=55),
                location="Lat: -26.2041 S, Lng: 28.0473 E (Accuracy: ±8m, Commissioner St, JHB)",
            ),
            Evidence(
                client_id=sipho.id,
                case_id=sipho_accident_case.id,
                type=EvidenceType.SCENE_PHOTO,
                file="https://storage.royalsquare.co.za/evidence/accidents/ac_2048_scene_01.jpg",
                extracted_data={
                    "exif_timestamp": (base_time - timedelta(hours=3, minutes=52)).isoformat(),
                    "device": "Samsung Galaxy S24",
                    "scene_type": "four_way_intersection",
                    "weather_conditions": "overcast",
                },
                validation_state="valid",
                timestamp=base_time - timedelta(hours=3, minutes=52),
                location="-26.2041 S, 28.0473 E",
            ),
            Evidence(
                client_id=sipho.id,
                case_id=sipho_accident_case.id,
                type=EvidenceType.VEHICLE_PHOTO,
                file="https://storage.royalsquare.co.za/evidence/accidents/ac_2048_vehicle_damage_right_front.jpg",
                extracted_data={
                    "damaged_parts": ["front_bumper", "right_headlight", "fender"],
                    "airbags_deployed": False,
                    "drivable": True,
                },
                validation_state="valid",
                timestamp=base_time - timedelta(hours=3, minutes=50),
                location="-26.2041 S, 28.0473 E",
            ),
            Evidence(
                client_id=sipho.id,
                case_id=sipho_accident_case.id,
                type=EvidenceType.VOICE_STATEMENT,
                file="https://storage.royalsquare.co.za/evidence/accidents/ac_2048_voice_note_statement.m4a",
                extracted_data={
                    "audio_duration_seconds": 38,
                    "transcript": "I was driving west on Commissioner Street. A delivery bakkie failed to yield at the intersection and clipped my front right fender. No injuries occurred, both drivers exchanged numbers.",
                    "extracted_entities": {
                        "incident_type": "side_impact_collision",
                        "location_mentioned": "Commissioner Street",
                        "injuries": False,
                        "other_vehicle": "white light delivery bakkie",
                    },
                },
                validation_state="valid",
                timestamp=base_time - timedelta(hours=3, minutes=45),
                location="-26.2041 S, 28.0473 E",
            ),
        ]
        db.add_all(sipho_evidence)

        # AuditEvents for Sipho's Motor Accident
        sipho_audit = [
            AuditEvent(
                actor="client:sipho_dlamini",
                action="accident_mode.initiated_offline",
                timestamp=base_time - timedelta(hours=4),
                case_id=sipho_accident_case.id,
                metadata={
                    "network_state": "offline",
                    "device": "Android / Chrome Mobile",
                    "case_number_local": "AC-2048",
                },
            ),
            AuditEvent(
                actor="client:sipho_dlamini",
                action="device.gps_captured",
                timestamp=base_time - timedelta(hours=3, minutes=55),
                case_id=sipho_accident_case.id,
                metadata={
                    "coordinates": {"lat": -26.2041, "lng": 28.0473},
                    "accuracy": 8,
                },
            ),
            AuditEvent(
                actor="client:sipho_dlamini",
                action="evidence.scene_photo_captured",
                timestamp=base_time - timedelta(hours=3, minutes=52),
                case_id=sipho_accident_case.id,
                metadata={"file": "ac_2048_scene_01.jpg"},
            ),
            AuditEvent(
                actor="client:sipho_dlamini",
                action="evidence.vehicle_photo_captured",
                timestamp=base_time - timedelta(hours=3, minutes=50),
                case_id=sipho_accident_case.id,
                metadata={"file": "ac_2048_vehicle_damage_right_front.jpg"},
            ),
            AuditEvent(
                actor="client:sipho_dlamini",
                action="voice.statement_recorded",
                timestamp=base_time - timedelta(hours=3, minutes=45),
                case_id=sipho_accident_case.id,
                metadata={"duration_seconds": 38},
            ),
            AuditEvent(
                actor="client:sipho_dlamini",
                action="case.synced_from_offline",
                timestamp=base_time - timedelta(hours=1, minutes=10),
                case_id=sipho_accident_case.id,
                metadata={
                    "connection_restored": True,
                    "payload_size_kb": 4180,
                    "server_received_at": (base_time - timedelta(hours=1, minutes=10)).isoformat(),
                },
            ),
            AuditEvent(
                actor="system:evidence_engine",
                action="evidence.completeness_evaluated",
                timestamp=base_time - timedelta(hours=1, minutes=5),
                case_id=sipho_accident_case.id,
                metadata={
                    "completeness_score": "75%",
                    "items_present": ["location", "scene_photos", "vehicle_photos", "voice_statement"],
                    "items_missing": ["witness_details"],
                    "prompt_user": "1 item still missing before you leave the scene: witness details, if available.",
                },
            ),
        ]
        db.add_all(sipho_audit)

        # =====================================================================
        # CLIENT 3: Thandi Khumalo
        # =====================================================================
        print("--- Seeding Client 3: Thandi Khumalo ---")
        thandi = Client(
            name="Thandi Khumalo",
            id_number="8503200142089",
            address="18 West Road South, Morningside, Sandton, 2196",
            mobile="+27 83 490 2831",
            email="thandi.khumalo@investec.co.za",
            adviser_id=qiniso.id,
            financial_position={
                "net_worth": 3800000.00,
                "assets": {
                    "property": 2800000.00,
                    "vehicle": 400000.00,
                    "cash": 250000.00,
                },
                "liabilities": {
                    "bond": 600000.00,
                },
                "investments": {
                    "endowment": 500000.00,
                    "equity_portfolio": 650000.00,
                },
                "insurance": {
                    "life_cover": 5000000.00,
                    "income_protection": 50000.00,
                },
                "retirement": {
                    "retirement_annuity": 1200000.00,
                },
            },
            consent_state="granted",
            consent_version="v1.0",
            consent_timestamp=base_time - timedelta(days=240),
            consent_revoked=False,
            retention_status="active",
            deletion_request_state="none",
            created_at=base_time - timedelta(days=240),
            updated_at=base_time - timedelta(days=3),
        )
        db.add(thandi)
        db.flush()

        thandi_compliance = ComplianceState(
            client_id=thandi.id,
            identity_verified=True,
            consent_valid=True,
            pep_screening_clear=True,
            documents_complete=True,
            instruction_recorded=True,
            disclosure_delivered=True,
            audit_trail_ready=True,
        )
        db.add(thandi_compliance)

        thandi_goals = [
            Goal(
                client_id=thandi.id,
                name="Offshore Portfolio Diversification",
                target_amount=Decimal("1000000.00"),
                current_amount=Decimal("650000.00"),  # 65%
                status="on_track",
            ),
            Goal(
                client_id=thandi.id,
                name="Settle Property Bond",
                target_amount=Decimal("600000.00"),
                current_amount=Decimal("420000.00"),  # 70%
                status="on_track",
            ),
        ]
        db.add_all(thandi_goals)

        # Case 1: Beneficiary Change case with status "waiting on provider"
        thandi_provider_case = Case(
            client_id=thandi.id,
            adviser_id=qiniso.id,
            case_type=CaseType.BENEFICIARY_CHANGE,
            status="waiting on provider",  # Exact required status string
            priority="normal",
            current_step="provider_processing",
            created_at=base_time - timedelta(days=4),
            updated_at=base_time - timedelta(hours=6),
        )
        db.add(thandi_provider_case)
        db.flush()

        thandi_provider_steps = [
            WorkflowStep(
                case_id=thandi_provider_case.id,
                key="client_beneficiary_instruction",
                title="Client Submits Beneficiary Nomination Instruction",
                owner=WorkflowStepOwner.CLIENT,
                status="completed",
                order=1,
                required_evidence="form_submission",
                due_date=base_time - timedelta(days=4),
                completion_timestamp=base_time - timedelta(days=4),
            ),
            WorkflowStep(
                case_id=thandi_provider_case.id,
                key="adviser_compliance_check",
                title="Adviser Verifies Identity & Confirms Policy Eligibility",
                owner=WorkflowStepOwner.ADVISER,
                status="completed",
                order=2,
                due_date=base_time - timedelta(days=3),
                completion_timestamp=base_time - timedelta(days=3),
            ),
            WorkflowStep(
                case_id=thandi_provider_case.id,
                key="provider_processing",
                title="Awaiting Policy Endorsement from Insurer (Sanlam Life)",
                owner=WorkflowStepOwner.PROVIDER,
                status="in_progress",
                order=3,
                required_evidence="provider_endorsement_letter",
                due_date=base_time + timedelta(days=3),
                completion_timestamp=None,
            ),
            WorkflowStep(
                case_id=thandi_provider_case.id,
                key="case_finalization",
                title="Send Updated Policy Schedule to Client & Close Case",
                owner=WorkflowStepOwner.SYSTEM,
                status="pending",
                order=4,
                due_date=base_time + timedelta(days=5),
                completion_timestamp=None,
            ),
        ]
        db.add_all(thandi_provider_steps)

        thandi_evidence = Evidence(
            client_id=thandi.id,
            case_id=thandi_provider_case.id,
            type=EvidenceType.IDENTITY_DOCUMENT,
            file="https://storage.royalsquare.co.za/evidence/clients/thandi_khumalo_smart_id.pdf",
            extracted_data={
                "document_type": "RSA Smart ID Card",
                "id_number": "8503200142089",
                "full_names": "Thandi Zodwa Khumalo",
                "country_of_birth": "South Africa",
                "date_of_birth": "1985-03-20",
                "status": "active_verified",
            },
            validation_state="valid",
            timestamp=base_time - timedelta(days=4),
            location="Sandton, Johannesburg",
        )
        db.add(thandi_evidence)

        thandi_submission = FormSubmission(
            client_id=thandi.id,
            case_id=thandi_provider_case.id,
            form_version="beneficiary-nomination/v1.0",
            answers={
                "policy_number": "SAN-948102-L",
                "primary_beneficiary": "Siphiwe Khumalo (Son)",
                "relationship": "Child",
                "allocation_percentage": 100,
            },
            signature={
                "signed": True,
                "signed_by": "Thandi Khumalo",
                "timestamp": (base_time - timedelta(days=4)).isoformat(),
            },
            submitted_timestamp=base_time - timedelta(days=4),
            status="submitted",
            generated_document="https://storage.royalsquare.co.za/documents/thandi_beneficiary_signed.pdf",
        )
        db.add(thandi_submission)

        thandi_provider_audit = [
            AuditEvent(
                actor="client:thandi_khumalo",
                action="case.created",
                timestamp=base_time - timedelta(days=4),
                case_id=thandi_provider_case.id,
                metadata={"case_type": "beneficiary_change", "source": "client_portal"},
            ),
            AuditEvent(
                actor="client:thandi_khumalo",
                action="form.submitted",
                timestamp=base_time - timedelta(days=4),
                case_id=thandi_provider_case.id,
                metadata={"policy_number": "SAN-948102-L"},
            ),
            AuditEvent(
                actor="adviser:qiniso_ntuli",
                action="adviser.approved",
                timestamp=base_time - timedelta(days=3),
                case_id=thandi_provider_case.id,
                metadata={"review_note": "Beneficiary percentages validated. FICA compliant."},
            ),
            AuditEvent(
                actor="system:provider_adapter",
                action="provider.submitted",
                timestamp=base_time - timedelta(days=2),
                case_id=thandi_provider_case.id,
                metadata={
                    "provider": "Sanlam Life",
                    "providerReference": "RSF-MOCK-2841",
                    "dispatch_status": "transmitted",
                    "acknowledgement": "accepted_in_queue",
                },
            ),
        ]
        db.add_all(thandi_provider_audit)

        # Case 2: Completed Annual Review Case for Thandi
        thandi_completed_review = Case(
            client_id=thandi.id,
            adviser_id=qiniso.id,
            case_type=CaseType.ANNUAL_REVIEW,
            status="completed",
            priority="normal",
            current_step="completed",
            created_at=base_time - timedelta(days=60),
            updated_at=base_time - timedelta(days=52),
        )
        db.add(thandi_completed_review)
        db.flush()

        thandi_review_steps = [
            WorkflowStep(
                case_id=thandi_completed_review.id,
                key="annual_review_invitation",
                title="Annual Review Invitation Dispatched",
                owner=WorkflowStepOwner.SYSTEM,
                status="completed",
                order=1,
                due_date=base_time - timedelta(days=60),
                completion_timestamp=base_time - timedelta(days=60),
            ),
            WorkflowStep(
                case_id=thandi_completed_review.id,
                key="portfolio_pack_compiled",
                title="Annual Portfolio Pack Compiled",
                owner=WorkflowStepOwner.ADVISER,
                status="completed",
                order=2,
                due_date=base_time - timedelta(days=58),
                completion_timestamp=base_time - timedelta(days=58),
            ),
            WorkflowStep(
                case_id=thandi_completed_review.id,
                key="review_meeting",
                title="Annual Review Consultation with Adviser",
                owner=WorkflowStepOwner.ADVISER,
                status="completed",
                order=3,
                due_date=base_time - timedelta(days=54),
                completion_timestamp=base_time - timedelta(days=54),
            ),
            WorkflowStep(
                case_id=thandi_completed_review.id,
                key="record_of_advice_signed",
                title="Record of Advice Signed & Retained",
                owner=WorkflowStepOwner.CLIENT,
                status="completed",
                order=4,
                due_date=base_time - timedelta(days=52),
                completion_timestamp=base_time - timedelta(days=52),
            ),
        ]
        db.add_all(thandi_review_steps)

        thandi_review_submission = FormSubmission(
            client_id=thandi.id,
            case_id=thandi_completed_review.id,
            form_version="record-of-advice/v2.1",
            answers={
                "annual_review_notes": "Portfolio rebalancing performed. Increased offshore equity allocation by 5%.",
                "risk_profile_reassessed": "Moderate Aggressive",
            },
            signature={
                "signed": True,
                "adviser_signature": "Qiniso Ntuli",
                "client_signature": "Thandi Khumalo",
                "date": (base_time - timedelta(days=52)).strftime("%Y-%m-%d"),
            },
            submitted_timestamp=base_time - timedelta(days=52),
            status="completed",
            generated_document="https://storage.royalsquare.co.za/documents/thandi_roa_2026_signed.pdf",
        )
        db.add(thandi_review_submission)

        thandi_review_audit = [
            AuditEvent(
                actor="system:scheduler",
                action="case.created",
                timestamp=base_time - timedelta(days=60),
                case_id=thandi_completed_review.id,
                metadata={"review_year": 2026},
            ),
            AuditEvent(
                actor="adviser:qiniso_ntuli",
                action="consultation.completed",
                timestamp=base_time - timedelta(days=54),
                case_id=thandi_completed_review.id,
                metadata={"duration_minutes": 45, "format": "in_person"},
            ),
            AuditEvent(
                actor="client:thandi_khumalo",
                action="client.signed",
                timestamp=base_time - timedelta(days=52),
                case_id=thandi_completed_review.id,
                metadata={"document": "Record of Advice"},
            ),
            AuditEvent(
                actor="adviser:qiniso_ntuli",
                action="case.completed",
                timestamp=base_time - timedelta(days=52),
                case_id=thandi_completed_review.id,
                metadata={"outcome": "closed_with_signed_advice_record"},
            ),
        ]
        db.add_all(thandi_review_audit)

        db.commit()
        print("=== Database successfully seeded! ===")
        print(f"Advisers: {db.query(Adviser).count()}")
        print(f"Clients: {db.query(Client).count()}")
        print(f"Goals: {db.query(Goal).count()}")
        print(f"Cases: {db.query(Case).count()}")
        print(f"WorkflowSteps: {db.query(WorkflowStep).count()}")
        print(f"Evidence: {db.query(Evidence).count()}")
        print(f"FormDefinitions: {db.query(FormDefinition).count()}")
        print(f"FormSubmissions: {db.query(FormSubmission).count()}")
        print(f"ComplianceStates: {db.query(ComplianceState).count()}")
        print(f"AuditEvents: {db.query(AuditEvent).count()}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
