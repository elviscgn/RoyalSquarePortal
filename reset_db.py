"""Royal Square Portal - Database Reset Utility
Completely resets the database to a fresh slate.

Usage:
  python3 reset_db.py          # Wipes all tables, reapplies migrations, and seeds demo data
  python3 reset_db.py --empty  # Wipes all tables and reapplies migrations (zero records)
"""

import sys
import os
import subprocess
from sqlalchemy import text

# Ensure project root in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.database.config import engine, DATABASE_URL
from src.database.models import Base
from seed import seed_database


def reset_database(seed: bool = True):
    print(f"Connecting to database: {DATABASE_URL}")
    print("1. Dropping all existing tables and types...")

    with engine.connect() as conn:
        # Drop public schema and recreate it to guarantee all tables, enums, and alembic version are erased
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
        conn.commit()
    print("  ✓ Schema wiped completely.")

    print("2. Running Alembic migrations to head...")
    subprocess.run(["alembic", "upgrade", "head"], check=True)
    print("  ✓ Migration 'head' applied cleanly.")

    if seed:
        print("3. Seeding fresh demo data...")
        seed_database()
        print("  ✓ Fresh demo state populated!")
    else:
        print("3. Left completely empty as requested (--empty).")

    print("\n🎉 Database reset complete! You are on a 100% fresh slate.")


if __name__ == "__main__":
    should_seed = "--empty" not in sys.argv
    reset_database(seed=should_seed)
