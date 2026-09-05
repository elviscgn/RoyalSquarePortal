# Royal Square Portal — Trust, POPIA & Security Architecture

**Author**: Amahle (Database & Trust Layer)  
**Deliverable**: Pitch & Demo Defense / Backend Trust Architecture Reference  

---

## 1. Executive Summary & Pitch Phrasing

> [!IMPORTANT]
> **Strict Pitch Rule**: Never claim "Fully POPIA compliant."  
> **Approved Pitch Talking Point**:  
> *"Designed around POPIA principles including data minimisation, consent tracking, purpose limitation, role-based access, and immutable auditability."*

---

## 2. Sensitive Data We Handle

In the South African financial services context (FAIS, FICA, POPIA), our schema manages:
1. **Special Personal Information & Identifiers**: RSA 13-digit National ID number, physical address, verified contact details (`Client.id_number`, `Client.address`, `Client.mobile`, `Client.email`).
2. **Granular Financial Position**: Net worth, assets, liabilities, retirement funds, investment portfolios, and life/disability insurance (`Client.financial_position` JSONB).
3. **Banking & FICA Evidence**: Bank statements, account numbers, branch codes, verified account holder signatures (`Evidence.extracted_data`, `FormSubmission.answers`).
4. **Biometric & Telemetry Evidence**:
   - Time-stamped GPS coordinates and accuracy bounds (`Evidence.location`).
   - Accident scene and vehicle damage photos (`Evidence.file`).
   - Voice recordings and transcribed statements (`Evidence.extracted_data`).

---

## 3. How POPIA Principles Are Enforced in the Architecture

### A. Data Minimisation ("Enter Once. Collect Only What is Missing")
- Canonical Client profile is verified once (`Client`).
- Form workflows (`FormDefinition` -> `FormSubmission`) dynamically pre-fill existing verified information so clients are never asked to re-enter sensitive data across repetitive paperwork.
- Only data required for the specific workflow (e.g. banking instruction or accident claim) is collected.

### B. Purpose Limitation & Consent Lifecycle
- Every client record tracks active consent state:
  - `consent_state`: `granted` | `pending` | `revoked`
  - `consent_version`: Tracks the specific terms accepted (e.g. `v1.0`).
  - `consent_timestamp`: Exact moment of legal consent capture.
  - `consent_revoked`: Boolean flag enabling instant revocation of advisory processing.
- Retention controls:
  - `retention_status`: `active` | `retained` | `archived`
  - `deletion_request_state`: Supports POPIA Section 24 right-to-be-forgotten requests.

### C. Access Control (Role Separation)
Entities and workflow step ownership are explicitly partitioned across four roles:
- `client`: Restricted to viewing own profile, goals, active cases, and submitting requested evidence.
- `adviser`: Assigned cases, triage queue, exception approvals, and compliance verification.
- `system`: Automated background pipelines (OCR extraction, age validation, notification scheduler).
- `provider`: Sandboxed interactions with external underwriters / product providers (Discovery, Old Mutual, Sanlam).

### D. Auditability & Non-Repudiation
- Every critical event creates an immutable `AuditEvent` record with:
  - `actor`: System component or user ID (e.g. `client:naledi_mokoena`, `adviser:qiniso_ntuli`, `system:ocr_pipeline`).
  - `action`: Specific state change (e.g. `document.uploaded`, `bank_statement.validated`, `client.signed`, `provider.submitted`).
  - `timestamp`: UTC timestamp.
  - `case_id`: Direct linkage to the active case.
  - `metadata`: JSON payload capturing context (IP addresses, device telemetry, confidence scores).
- Foreign key on `case_id` utilizes `ON DELETE SET NULL`, ensuring the audit trail remains intact even if a case is purged.

---

## 4. Production-Ready vs Mocked for Demo

| Capability | Production-Ready in this Build | Mocked / Simulated for Demo |
| :--- | :--- | :--- |
| **Database Schema** | Full PostgreSQL declarative models, foreign keys, cascades, indices | — |
| **Migrations** | Real Alembic migrations applied to Postgres | — |
| **Audit Trail** | Real database tables & queryable events with JSONB metadata | — |
| **Compliance State** | 7-point compliance checklist model (`ComplianceState`) | Automated PEP/FICA live bureau lookup simulated |
| **Document Validation** | Schema validation rules & age bounds (< 90 days) | Real-time OCR document parsing simulated deterministically |
| **Provider Submissions** | Case state transitions to `waiting on provider` | Direct SOAP/REST integration with legacy insurer mainframes simulated via provider adapter |
| **Accident Offline Mode** | Full schema support for GPS coordinates, photos, voice notes | Device network disconnect simulated via frontend toggle |
