# Royal Square Portal — Database & Trust Layer

Database and trust architecture for Royal Square Portal (South African financial adviser operations platform).

## Tech Stack
- **Database**: PostgreSQL 16 (JSONB native support, Enums, foreign keys, cascades)
- **ORM**: SQLAlchemy 2.0 (Declarative style, bi-directional `relationship()` with `back_populates`)
- **Migrations**: Alembic
- **Language**: Python 3.13 (Framework-agnostic: ready for FastAPI, Flask, Django, or Litestar)

---

## Quickstart

### 1. Requirements & Dependencies
```bash
pip install -r requirements.txt
```
*(Dependencies: `SQLAlchemy>=2.0.0`, `alembic>=1.14.0`, `psycopg2-binary>=2.9.0`)*

### 2. Database Setup & Migrations
Ensure PostgreSQL is running and the `royal_square` database is created:
```bash
# Set custom connection if needed (defaults to postgresql+psycopg2:///royal_square)
export DATABASE_URL="postgresql+psycopg2:///royal_square"

# Run Alembic migrations
alembic upgrade head
```

### 3. Seed Realistic Demo Data
```bash
python3 seed.py
```
This seeds:
- **Adviser**: Qiniso Ntuli (`qiniso@royalsquare.co.za`)
- **Client 1**: Naledi Mokoena (Compliance clear, active `bank_details_change` case at `adviser_review`, upcoming `annual_review`, 3 goals)
- **Client 2**: Sipho Dlamini (`motor_accident` case at `evidence_collection`, photos + GPS + voice statement present, witness missing)
- **Client 3**: Thandi Khumalo (Active case `waiting on provider`, completed `annual_review`)
- **FormDefinitions**: Standard Royal Square forms pre-configured
- **AuditEvents**: 25 chronological audit trail records across all cases

### 4. Reset / Wipe Database to a Fresh Slate
If you ever want to completely wipe the database and start over:
```bash
# Wipes all tables, reapplies migrations, and seeds the fresh demo dataset:
python3 reset_db.py

# Or wipes everything and leaves an empty database with schema only (0 records):
python3 reset_db.py --empty
```

### 5. Verify Schema & Relationships
```bash
python3 verify_schema.py
```

---

## Documentation for Teammates
- [contracts/SCHEMA_CONTRACT.md](file:///Users/amahlecele/Documents/vs_code_files/RoyalSquarePortal/contracts/SCHEMA_CONTRACT.md): Exact table schemas, enums, relationship map, and 1 example JSON payload per entity for API endpoints.
- [contracts/TRUST_AND_POPIA_SUMMARY.md](file:///Users/amahlecele/Documents/vs_code_files/RoyalSquarePortal/contracts/TRUST_AND_POPIA_SUMMARY.md): Privacy, POPIA principles, access control, auditability, and pitch defense summary.