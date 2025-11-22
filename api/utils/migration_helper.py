"""
Migration helper to safely add missing columns during application startup
"""
from sqlalchemy import text, inspect
import logging

logger = logging.getLogger(__name__)

def check_and_add_missing_columns(db):
    """
    Check and add missing columns to the users table during startup
    This prevents deployment failures when new model fields are added
    """
    try:
        # Define all expected columns and their SQL definitions for PostgreSQL
        expected_columns = {
            'bio': 'TEXT',
            'timezone': "VARCHAR(50) DEFAULT 'UTC'",
            'language': "VARCHAR(10) DEFAULT 'en'",
            'theme': "VARCHAR(20) DEFAULT 'dark'",
            'backup_codes': 'TEXT',
            'last_activity_at': 'TIMESTAMP',
            'session_count': 'INTEGER DEFAULT 0',
            'subscription_plan': 'VARCHAR(50)',
            'subscription_status': "VARCHAR(50) DEFAULT 'active'",
            'avatar': 'VARCHAR(500)',
            'profile_picture': 'VARCHAR(500)',
            'reset_token': 'VARCHAR(255)',
            'reset_token_expiry': 'TIMESTAMP',
            'phone': 'VARCHAR(20)',
            'country': 'VARCHAR(100)',
            'two_factor_enabled': 'BOOLEAN DEFAULT FALSE',
            'two_factor_secret': 'VARCHAR(255)',
            'telegram_bot_token': 'VARCHAR(255)',
            'telegram_chat_id': 'VARCHAR(100)',
            'telegram_enabled': 'BOOLEAN DEFAULT FALSE',
        }
        
        # Get existing columns
        inspector = inspect(db.engine)
        existing_columns = [col['name'] for col in inspector.get_columns('users')]
        
        # Find missing columns
        missing_columns = {k: v for k, v in expected_columns.items() if k not in existing_columns}
        
        if not missing_columns:
            logger.info("✓ All user table columns are present")
            return True
            
        logger.info(f"Found {len(missing_columns)} missing columns, adding them...")
        
        # Add missing columns
        with db.engine.begin() as connection:
            for column_name, column_def in missing_columns.items():
                try:
                    sql = text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {column_name} {column_def}")
                    connection.execute(sql)
                    logger.info(f"✓ Added column: {column_name}")
                except Exception as e:
                    logger.error(f"✗ Failed to add column {column_name}: {e}")
                    # Don't fail completely, try to add other columns
                    continue
        
        logger.info("✓ Migration completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        # Don't fail the application startup, just log the error
        return False

def safe_create_default_admin(db, User):
    """
    Safely create default admin user without triggering missing column errors
    """
    try:
        # Check if admin exists using raw SQL to avoid model field errors
        with db.engine.connect() as connection:
            result = connection.execute(
                text("SELECT id FROM users WHERE username = :username"),
                {"username": "Brain"}
            )
            exists = result.fetchone() is not None
        
        if not exists:
            # Create admin user
            admin_user = User(
                username="Brain",
                email="admin@brainlinktracker.com",
                role="main_admin",
                status="active",
                is_active=True,
                is_verified=True
            )
            admin_user.set_password("Mayflower1!!")
            db.session.add(admin_user)
            db.session.commit()
            logger.info("✓ Default admin user 'Brain' created")
            return True
        else:
            logger.info("✓ Admin user 'Brain' already exists")
            return True
            
    except Exception as e:
        logger.error(f"✗ Failed to create default admin: {e}")
        db.session.rollback()
        return False
