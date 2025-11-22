"""
Database migration script to add new fields to users table
Run this script to add missing user fields for full functionality
"""

from api.database import db
from api.models.user import User
from sqlalchemy import text

def run_migration():
    """Add new columns to users table if they don't exist"""
    print("Starting migration: Adding new user fields...")
    
    try:
        # Get database connection
        connection = db.engine.connect()
        
        # List of columns to add with their SQL definitions
        columns_to_add = [
            ("phone", "VARCHAR(20)"),
            ("country", "VARCHAR(100)"),
            ("bio", "TEXT"),
            ("timezone", "VARCHAR(50) DEFAULT 'UTC'"),
            ("language", "VARCHAR(10) DEFAULT 'en'"),
            ("theme", "VARCHAR(20) DEFAULT 'dark'"),
            ("two_factor_enabled", "BOOLEAN DEFAULT FALSE"),
            ("two_factor_secret", "VARCHAR(255)"),
            ("backup_codes", "TEXT"),
            ("last_activity_at", "DATETIME"),
            ("session_count", "INTEGER DEFAULT 0"),
        ]
        
        # Check which columns exist
        result = connection.execute(text("PRAGMA table_info(users)"))
        existing_columns = [row[1] for row in result]
        
        # Add missing columns
        for column_name, column_def in columns_to_add:
            if column_name not in existing_columns:
                try:
                    alter_sql = f"ALTER TABLE users ADD COLUMN {column_name} {column_def}"
                    connection.execute(text(alter_sql))
                    connection.commit()
                    print(f"✓ Added column: {column_name}")
                except Exception as e:
                    print(f"✗ Failed to add column {column_name}: {e}")
            else:
                print(f"- Column already exists: {column_name}")
        
        connection.close()
        print("\n✓ Migration completed successfully!")
        return True
        
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
        return False

if __name__ == "__main__":
    from api.index import app
    with app.app_context():
        run_migration()
