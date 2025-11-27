import os
import sys
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    print("Please set DATABASE_URL in your .env file or environment.")
    sys.exit(1)

print(f"Connecting to database...")
try:
    engine = create_engine(DATABASE_URL)
except Exception as e:
    print(f"ERROR creating engine: {e}")
    sys.exit(1)

print("Reading migration file...")
migration_file = 'migrations/add_missing_columns.sql'
if not os.path.exists(migration_file):
    print(f"ERROR: Migration file {migration_file} not found!")
    sys.exit(1)

with open(migration_file, 'r') as f:
    migration_sql = f.read()

print("Executing migration...")
try:
    with engine.connect() as conn:
        # Execute migration in a transaction
        trans = conn.begin()
        try:
            # Split by semicolon to execute statements individually if needed, 
            # but sqlalchemy usually handles blocks. 
            # However, for safety with some drivers, let's try executing the whole block.
            # If it fails, we might need to split.
            conn.execute(text(migration_sql))
            trans.commit()
            print("[OK] Migration executed successfully!")
        except Exception as e:
            trans.rollback()
            print(f"ERROR during migration execution: {e}")
            raise
except Exception as e:
    print(f"ERROR connecting to database: {e}")
    sys.exit(1)

print("\nVerifying new columns...")
try:
    with engine.connect() as conn:
        # Check users table columns
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('avatar_url', 'background_url', 'background_color', 'theme')
        """))
        columns = [row[0] for row in result]
        print(f"[OK] Found {len(columns)}/4 new columns in users table:")
        for col in columns:
            print(f"  - {col}")

        # Check campaigns table columns
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'campaigns' 
            AND column_name IN ('type', 'impressions', 'total_visitors', 'last_activity_date')
        """))
        columns = [row[0] for row in result]
        print(f"[OK] Found {len(columns)}/4 new columns in campaigns table:")
        for col in columns:
            print(f"  - {col}")

except Exception as e:
    print(f"ERROR verifying columns: {e}")

print("\n[OK] Final migration completed successfully!")
