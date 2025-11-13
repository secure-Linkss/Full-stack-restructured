import os
import sys
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in environment variables")
    sys.exit(1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

print("Reading migration file...")
with open('migrations/005_payment_system_enhancement.sql', 'r') as f:
    migration_sql = f.read()

print("Executing migration...")
try:
    with engine.connect() as conn:
        # Execute migration in a transaction
        trans = conn.begin()
        try:
            conn.execute(text(migration_sql))
            trans.commit()
            print("✓ Migration executed successfully!")
        except Exception as e:
            trans.rollback()
            print(f"ERROR during migration: {e}")
            raise
except Exception as e:
    print(f"ERROR connecting to database: {e}")
    sys.exit(1)

print("\nVerifying new tables...")
try:
    with engine.connect() as conn:
        result = conn.execute(text("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'crypto_payment_transactions',
                'crypto_wallet_addresses',
                'payment_api_settings',
                'subscription_plans',
                'payment_history'
            )
            ORDER BY table_name
        """))
        tables = [row[0] for row in result]
        print(f"✓ Found {len(tables)} new tables:")
        for table in tables:
            print(f"  - {table}")
except Exception as e:
    print(f"ERROR verifying tables: {e}")

print("\n✓ Payment system migration completed successfully!")
