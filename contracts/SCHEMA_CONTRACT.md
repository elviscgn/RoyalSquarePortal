# Royal Square Portal — Backend Schema & API Contract Reference

**Target Audience**: Latoya (Backend A: Workflows & Cases), Vakele (Backend B: Documents & Forms), Elvis (Frontend).  
**Maintained by**: Amahle (Database & Trust Layer).  
**Stack**: PostgreSQL 16 + SQLAlchemy 2.0 (declarative) + Alembic.  

All field names, types, and relationships below are **locked and stable**. Do not rename or restructure these fields when building endpoints or consuming API responses.

---

## 1. Entity Relationship Diagram

```
Adviser (1)
 └── Clients (many)
      ├── ComplianceState (1-to-1)
      ├── Goals (many)
      ├── Evidence (many)
      ├── FormSubmissions (many)
      └── Cases (many)
           ├── WorkflowSteps (many, ordered)
           ├── Evidence (many)
           ├── FormSubmissions (many)
           └── AuditEvents (many, chronological)
```

---

## 2. Enums Reference

### `CaseType`
- `bank_details_change`: Client changing debit order/disbursement bank accounts.
- `motor_accident`: Emergency or roadside accident claim capture.
- `annual_review`: Statutory / SLA annual financial review.
- `beneficiary_change`: Updating policy / investment beneficiaries.
- `onboarding`: New client FICA/FAIS onboarding.

### `WorkflowStepOwner`
- `client`: Waiting on client input, document upload, or digital signature.
- `adviser`: Waiting on adviser approval, exception override, or consultation.
- `system`: Automated step (OCR validation, automated completeness check, notifications).
- `provider`: Waiting on external financial institution (Discovery, Old Mutual, Sanlam).

### `EvidenceType`
- `bank_statement`
- `identity_document`
- `scene_photo`
- `vehicle_photo`
- `voice_statement`
- `witness_details`
- `location`
- `other`

---

## 3. Example JSON Payloads (1 Per Entity)

### 1. `Adviser`
```json
{
  "id": 1,
  "name": "Qiniso Ntuli",
  "email": "qiniso@royalsquare.co.za"
}
```

### 2. `Client`
```json
{
  "id": 1,
  "name": "Naledi Mokoena",
  "id_number": "8804155028087",
  "address": "74 Rivonia Road, Sandhurst, Sandton, 2196",
  "mobile": "+27 82 555 1842",
  "email": "naledi.mokoena@vodamail.co.za",
  "adviser_id": 1,
  "financial_position": {
    "net_worth": 2450000.0,
    "assets": {
      "primary_residence": 1800000.0,
      "vehicle": 250000.0,
      "savings_account": 100000.0
    },
    "liabilities": {
      "home_loan": 1100000.0,
      "credit_card": 15000.0
    },
    "investments": {
      "tax_free_savings": 220000.0,
      "unit_trusts": 350000.0
    },
    "insurance": {
      "life_cover": 3000000.0,
      "dread_disease": 750000.0,
      "disability": 1500000.0
    },
    "retirement": {
      "retirement_annuity": 780000.0,
      "preservation_fund": 450000.0
    }
  },
  "consent_state": "granted",
  "consent_version": "v1.0",
  "consent_timestamp": "2026-05-08T10:30:00Z",
  "consent_revoked": false,
  "retention_status": "active",
  "deletion_request_state": "none",
  "created_at": "2026-05-08T10:30:00Z",
  "updated_at": "2026-09-05T09:45:00Z"
}
```

### 3. `Goal`
```json
{
  "id": 1,
  "client_id": 1,
  "name": "Home Deposit",
  "target_amount": 500000.0,
  "current_amount": 370000.0,
  "status": "on_track"
}
```

### 4. `Case`
```json
{
  "id": 1,
  "client_id": 1,
  "adviser_id": 1,
  "case_type": "bank_details_change",
  "status": "adviser_review",
  "priority": "high",
  "current_step": "adviser_review",
  "created_at": "2026-09-03T08:00:00Z",
  "updated_at": "2026-09-05T09:50:00Z"
}
```

### 5. `WorkflowStep`
```json
{
  "id": 5,
  "case_id": 1,
  "key": "adviser_review",
  "title": "Adviser Exception & Authorization Review",
  "owner": "adviser",
  "status": "in_progress",
  "order": 5,
  "required_evidence": null,
  "due_date": "2026-09-06T12:00:00Z",
  "completion_timestamp": null
}
```

### 6. `Evidence`
```json
{
  "id": 1,
  "client_id": 1,
  "case_id": 1,
  "type": "bank_statement",
  "file": "https://storage.royalsquare.co.za/evidence/clients/naledi_mokoena_std_bank_stmt.pdf",
  "extracted_data": {
    "bank_name": "Standard Bank South Africa",
    "account_holder": "Ms Naledi Mokoena",
    "account_number": "10192837465",
    "branch_code": "051001",
    "account_type": "Cheque Account",
    "statement_date": "2026-08-19",
    "statement_age_days": 17,
    "is_stamped": true,
    "confidence_score": 0.99,
    "validation_checks": {
      "age_under_90_days": true,
      "account_holder_matches_client": true,
      "id_number_verified": true
    }
  },
  "validation_state": "valid",
  "timestamp": "2026-09-04T10:20:00Z",
  "location": "Sandton, Johannesburg (Lat: -26.1076, Lng: 28.0567)"
}
```

### 7. `FormDefinition`
```json
{
  "id": "banking-details-instruction",
  "title": "Notice of Banking Details Change Instruction",
  "version": "v1.2",
  "fields": [
    {
      "key": "client_name",
      "type": "text",
      "label": "Full Name",
      "source": "client.name",
      "read_only": true
    },
    {
      "key": "id_number",
      "type": "text",
      "label": "RSA ID Number",
      "source": "client.id_number",
      "read_only": true
    },
    {
      "key": "bank_name",
      "type": "text",
      "label": "Bank Name",
      "required": true
    },
    {
      "key": "account_number",
      "type": "text",
      "label": "Account Number",
      "required": true
    },
    {
      "key": "signature",
      "type": "signature",
      "label": "Digital Signature / Acknowledgment",
      "required": true
    }
  ],
  "validation_rules": {
    "bank_statement_max_age_days": 90,
    "require_identity_match": true
  },
  "profile_mappings": {
    "client_name": "name",
    "id_number": "id_number",
    "email": "email"
  }
}
```

### 8. `FormSubmission`
```json
{
  "id": 1,
  "client_id": 1,
  "case_id": 1,
  "form_version": "banking-details-instruction/v1.2",
  "answers": {
    "client_name": "Naledi Mokoena",
    "id_number": "8804155028087",
    "bank_name": "Standard Bank South Africa",
    "account_holder": "Ms Naledi Mokoena",
    "account_number": "10192837465",
    "branch_code": "051001",
    "account_type": "Cheque",
    "effective_date": "2026-09-05",
    "declaration": "I certify that the above account is in my name and all debit orders/premiums may be drawn herefrom."
  },
  "signature": {
    "signed": true,
    "method": "digital_signature_pad",
    "signer_name": "Naledi Mokoena",
    "signer_ip": "196.25.1.14",
    "device": "Mobile Safari (iPhone 15 Pro)",
    "timestamp": "2026-09-05T09:45:00Z"
  },
  "submitted_timestamp": "2026-09-05T09:45:00Z",
  "status": "submitted",
  "generated_document": "https://storage.royalsquare.co.za/documents/naledi_banking_instruction_signed.pdf"
}
```

### 9. `AuditEvent`
```json
{
  "id": 3,
  "actor": "system:ocr_pipeline",
  "action": "bank_statement.validated",
  "timestamp": "2026-09-04T10:22:00Z",
  "case_id": 1,
  "metadata": {
    "statement_age_days": 17,
    "bank_detected": "Standard Bank",
    "account_match": true,
    "result": "PASS"
  }
}
```

### 10. `ComplianceState`
```json
{
  "id": 1,
  "client_id": 1,
  "identity_verified": true,
  "consent_valid": true,
  "pep_screening_clear": true,
  "documents_complete": true,
  "instruction_recorded": true,
  "disclosure_delivered": true,
  "audit_trail_ready": true
}
```

---

## 4. How to Import and Query in Your Endpoints

Whether you use **FastAPI**, **Flask**, or any other framework, you can import models and the database session directly:

```python
from src.database import SessionLocal, get_db
from src.database import Client, Case, WorkflowStep, Evidence, FormSubmission, AuditEvent

# Example 1: Querying a client with related data
db = SessionLocal()
client = db.query(Client).filter(Client.id == 1).first()

# Relationships are pre-configured:
active_cases = client.cases
compliance = client.compliance_state.to_dict()
goals = [g.to_dict() for g in client.goals]

# Example 2: Advancing a case workflow step
case = db.query(Case).filter(Case.id == 1).first()
steps = case.workflow_steps  # Automatically sorted by 'order'

# Example 3: Adding an immutable audit event
event = AuditEvent(
    actor="adviser:qiniso_ntuli",
    action="adviser.approved",
    case_id=case.id,
    metadata={"note": "Verified against ID and 17-day-old stamped statement"}
)
db.add(event)
db.commit()
```
