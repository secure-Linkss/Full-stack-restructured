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
            'reset_token_expires': 'TIMESTAMP',
            'phone': 'VARCHAR(20)',
            'country': 'VARCHAR(100)',
            'two_factor_enabled': 'BOOLEAN DEFAULT FALSE',
            'two_factor_secret': 'VARCHAR(255)',
            'telegram_bot_token': 'VARCHAR(255)',
            'telegram_chat_id': 'VARCHAR(100)',
            'telegram_enabled': 'BOOLEAN DEFAULT FALSE',
            # New columns
            'avatar_url': 'TEXT',
            'background_url': 'TEXT',
            'background_color': "VARCHAR(20) DEFAULT '#000000'",
            # Login tracking / lockout
            'login_count': 'INTEGER DEFAULT 0',
            'failed_login_attempts': 'INTEGER DEFAULT 0',
            'account_locked_until': 'TIMESTAMP',
            'last_login_at': 'TIMESTAMP',
            'last_login_ip': 'VARCHAR(50)',
        }
        
        # Get existing columns
        inspector = inspect(db.engine)
        existing_columns = [col['name'] for col in inspector.get_columns('users')]
        
        # Find missing columns
        missing_columns = {k: v for k, v in expected_columns.items() if k not in existing_columns}
        
        if missing_columns:
            logger.info(f"Found {len(missing_columns)} missing columns in users table, adding them...")
            
            # Add missing columns
            with db.engine.begin() as connection:
                for column_name, column_def in missing_columns.items():
                    try:
                        sql = text(f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {column_name} {column_def}")
                        connection.execute(sql)
                        logger.info(f"✓ Added column to users: {column_name}")
                    except Exception as e:
                        logger.error(f"✗ Failed to add column {column_name} to users: {e}")
                        continue
        else:
            logger.info("✓ All user table columns are present")

        # Check campaigns table
        check_and_add_campaign_columns(db)

        # Check other critical tables
        _check_table(db, 'links', {
            # Core URL fields
            'original_url': 'TEXT',
            'short_url': 'TEXT',
            'custom_slug': 'VARCHAR(100)',
            'domain': 'VARCHAR(255)',
            # Campaign
            'campaign_id': 'INTEGER',
            'campaign_name': "VARCHAR(255) DEFAULT 'Untitled Campaign'",
            # Timestamps
            'updated_at': 'TIMESTAMP',
            # Metadata
            'title': 'VARCHAR(255)',
            'description': 'TEXT',
            'tags': 'TEXT',
            'status': "VARCHAR(50) DEFAULT 'active'",
            # Click tracking
            'total_clicks': 'INTEGER DEFAULT 0',
            'click_count': 'INTEGER DEFAULT 0',
            'unique_clicks': 'INTEGER DEFAULT 0',
            'real_visitors': 'INTEGER DEFAULT 0',
            'blocked_attempts': 'INTEGER DEFAULT 0',
            'last_clicked_at': 'TIMESTAMP',
            # Expiration
            'expires_at': 'TIMESTAMP',
            'click_limit': 'INTEGER',
            'expiration_action': "VARCHAR(50) DEFAULT 'disable'",
            'expiration_redirect_url': 'TEXT',
            # Capture
            'capture_email': 'BOOLEAN DEFAULT FALSE',
            'capture_password': 'BOOLEAN DEFAULT FALSE',
            # Security
            'bot_blocking_enabled': 'BOOLEAN DEFAULT FALSE',
            'geo_targeting_enabled': 'BOOLEAN DEFAULT FALSE',
            'geo_targeting_type': "VARCHAR(20) DEFAULT 'allow'",
            'rate_limiting_enabled': 'BOOLEAN DEFAULT FALSE',
            'dynamic_signature_enabled': 'BOOLEAN DEFAULT FALSE',
            'mx_verification_enabled': 'BOOLEAN DEFAULT FALSE',
            # Pixels
            'facebook_pixel_id': 'VARCHAR(100)',
            'enable_facebook_pixel': 'BOOLEAN DEFAULT FALSE',
            'google_ads_pixel': 'VARCHAR(100)',
            'enable_google_ads_pixel': 'BOOLEAN DEFAULT FALSE',
            'tiktok_pixel': 'VARCHAR(100)',
            'enable_tiktok_pixel': 'BOOLEAN DEFAULT FALSE',
            # OG metadata
            'og_title': 'VARCHAR(255)',
            'og_description': 'TEXT',
            'og_image_url': 'TEXT',
            # Routing / health
            'routing_rules': 'TEXT',
            'health_status': "VARCHAR(20) DEFAULT 'unknown'",
            'health_response_code': 'INTEGER',
            'health_last_checked': 'TIMESTAMP',
            # Misc
            'preview_template_url': 'VARCHAR(500)',
            'qr_code_url': 'TEXT',
            'allowed_countries': 'TEXT',
            'blocked_countries': 'TEXT',
            'allowed_regions': 'TEXT',
            'blocked_regions': 'TEXT',
            'allowed_cities': 'TEXT',
            'blocked_cities': 'TEXT',
            'metadata_json': 'TEXT',
            # Channel Adaptive Mode™
            'channel_type': "VARCHAR(20) DEFAULT 'general'",
        })

        _check_table(db, 'notifications', {
            'notification_type': "VARCHAR(50) DEFAULT 'system'",
            'is_read': 'BOOLEAN DEFAULT FALSE',
            'priority': "VARCHAR(50) DEFAULT 'medium'",
            'action_url': 'VARCHAR(500)',
        })

        _check_table(db, 'domains', {
            'domain_type': "VARCHAR(50) DEFAULT 'custom'",
            'verified_at': 'TIMESTAMP',
            'description': 'VARCHAR(500)',
            'api_key': 'VARCHAR(500)',
            'total_links': 'INTEGER DEFAULT 0',
            'total_clicks': 'INTEGER DEFAULT 0',
        })

        _check_table(db, 'crypto_payment_transactions', {
            'verification_method': 'VARCHAR(50)',
            'blockchain_confirmations': 'INTEGER DEFAULT 0',
            'verified_by': 'INTEGER',
            'verified_at': 'TIMESTAMP',
            'rejection_reason': 'TEXT',
            'extra_metadata': 'JSON',
        })
        # Rename legacy 'metadata' column to 'extra_metadata' on existing databases
        _rename_column_if_exists(db, 'crypto_payment_transactions', 'metadata', 'extra_metadata')

        _check_table(db, 'audit_logs', {
            'target_type': 'VARCHAR(50)',
            'details': 'TEXT',
        })

        # tracking_events — fingerprint + quantum fields added in v2
        _check_table(db, 'tracking_events', {
            'fingerprint_hash':  'VARCHAR(64)',
            'fingerprint_score': 'INTEGER',
            'quantum_enabled':   'BOOLEAN DEFAULT FALSE',
            'quantum_click_id':  'VARCHAR(255)',
            'quantum_stage':     'VARCHAR(50)',
            'quantum_processing_time': 'FLOAT',
            'quantum_security_violation': 'VARCHAR(100)',
            'quantum_verified':  'BOOLEAN DEFAULT FALSE',
            'quantum_final_url': 'TEXT',
            'quantum_error':     'TEXT',
            'quantum_security_score': 'INTEGER',
            'is_verified_human': 'BOOLEAN DEFAULT FALSE',
        })

        # Ensure critical indexes exist on tracking_events (safe to run repeatedly)
        _ensure_indexes(db)

        logger.info("✓ Migration completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"✗ Migration failed: {e}")
        # Don't fail the application startup, just log the error
        return False


def _rename_column_if_exists(db, table_name, old_col, new_col):
    """Rename a column if the old name exists and the new name does not."""
    try:
        inspector = inspect(db.engine)
        if table_name not in inspector.get_table_names():
            return
        existing = [c['name'] for c in inspector.get_columns(table_name)]
        if old_col in existing and new_col not in existing:
            with db.engine.begin() as conn:
                conn.execute(text(
                    f"ALTER TABLE {table_name} RENAME COLUMN {old_col} TO {new_col}"
                ))
                logger.info(f"✓ Renamed {table_name}.{old_col} → {new_col}")
    except Exception as e:
        logger.warning(f"Column rename {table_name}.{old_col} → {new_col} skipped: {e}")


def _ensure_indexes(db):
    """Create critical performance indexes if they don't already exist."""
    indexes = [
        # tracking_events — high-volume table, all analytics filter on these
        ("ix_tracking_events_link_id",     "CREATE INDEX IF NOT EXISTS ix_tracking_events_link_id ON tracking_events (link_id)"),
        ("ix_tracking_events_timestamp",   "CREATE INDEX IF NOT EXISTS ix_tracking_events_timestamp ON tracking_events (timestamp DESC)"),
        ("ix_tracking_events_quantum_cid", "CREATE INDEX IF NOT EXISTS ix_tracking_events_quantum_cid ON tracking_events (quantum_click_id)"),
        # Composite: analytics dashboard queries filter by link_id + timestamp together
        ("ix_te_link_ts",                  "CREATE INDEX IF NOT EXISTS ix_te_link_ts ON tracking_events (link_id, timestamp DESC)"),
        # Bot/scanner detection queries
        ("ix_te_is_bot",                   "CREATE INDEX IF NOT EXISTS ix_te_is_bot ON tracking_events (is_bot) WHERE is_bot = TRUE"),
        ("ix_te_status",                   "CREATE INDEX IF NOT EXISTS ix_te_status ON tracking_events (status)"),
        # links — user lookup is the most common filter
        ("ix_links_user_id",               "CREATE INDEX IF NOT EXISTS ix_links_user_id ON links (user_id)"),
        ("ix_links_short_code",            "CREATE INDEX IF NOT EXISTS ix_links_short_code ON links (short_code)"),
        ("ix_links_status",                "CREATE INDEX IF NOT EXISTS ix_links_status ON links (status)"),
        # purl_mappings
        ("ix_purl_mappings_link_id",       "CREATE INDEX IF NOT EXISTS ix_purl_mappings_link_id ON purl_mappings (link_id)"),
        ("ix_purl_mappings_email",         "CREATE INDEX IF NOT EXISTS ix_purl_mappings_email ON purl_mappings (email)"),
        # crypto — pending payment lookup
        ("ix_crypto_tx_status",            "CREATE INDEX IF NOT EXISTS ix_crypto_tx_status ON crypto_payment_transactions (status)"),
        ("ix_crypto_tx_user_id",           "CREATE INDEX IF NOT EXISTS ix_crypto_tx_user_id ON crypto_payment_transactions (user_id)"),
        ("ix_crypto_tx_hash",              "CREATE INDEX IF NOT EXISTS ix_crypto_tx_hash ON crypto_payment_transactions (transaction_hash)"),
        # link_health_logs
        ("ix_link_health_logs_link_id",    "CREATE INDEX IF NOT EXISTS ix_link_health_logs_link_id ON link_health_logs (link_id)"),
        # notifications — user inbox queries
        ("ix_notifications_user_id",       "CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id, created_at DESC)"),
    ]
    inspector = inspect(db.engine)
    existing_tables = inspector.get_table_names()
    with db.engine.begin() as conn:
        for name, ddl in indexes:
            # Only run against tables that exist
            table = ddl.split(" ON ")[1].split(" ")[0]
            if table not in existing_tables:
                continue
            try:
                conn.execute(text(ddl))
                logger.info(f"✓ Index ensured: {name}")
            except Exception as e:
                logger.warning(f"Index {name} skipped: {e}")


def _check_table(db, table_name, expected_columns):
    """Generic helper to check and add missing columns for any table"""
    try:
        inspector = inspect(db.engine)
        if table_name not in inspector.get_table_names():
            logger.info(f"Table '{table_name}' does not exist yet, skipping column check")
            return

        existing_columns = [col['name'] for col in inspector.get_columns(table_name)]
        missing_columns = {k: v for k, v in expected_columns.items() if k not in existing_columns}

        if missing_columns:
            logger.info(f"Found {len(missing_columns)} missing columns in {table_name}, adding...")
            with db.engine.begin() as connection:
                for column_name, column_def in missing_columns.items():
                    try:
                        sql = text(f"ALTER TABLE {table_name} ADD COLUMN IF NOT EXISTS {column_name} {column_def}")
                        connection.execute(sql)
                        logger.info(f"✓ Added column to {table_name}: {column_name}")
                    except Exception as e:
                        logger.error(f"✗ Failed to add column {column_name} to {table_name}: {e}")
        else:
            logger.info(f"✓ All {table_name} columns are present")
    except Exception as e:
        logger.error(f"✗ {table_name} migration check failed: {e}")

def check_and_add_campaign_columns(db):
    """Check and add missing columns to campaigns table"""
    try:
        expected_columns = {
            'type': "VARCHAR(50) DEFAULT 'standard'",
            'impressions': 'INTEGER DEFAULT 0',
            'total_visitors': 'INTEGER DEFAULT 0',
            'last_activity_date': 'TIMESTAMP',
        }
        
        inspector = inspect(db.engine)
        # Check if table exists first
        if 'campaigns' not in inspector.get_table_names():
            return
            
        existing_columns = [col['name'] for col in inspector.get_columns('campaigns')]
        missing_columns = {k: v for k, v in expected_columns.items() if k not in existing_columns}
        
        if missing_columns:
            logger.info(f"Found {len(missing_columns)} missing columns in campaigns table, adding them...")
            with db.engine.begin() as connection:
                for column_name, column_def in missing_columns.items():
                    try:
                        sql = text(f"ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS {column_name} {column_def}")
                        connection.execute(sql)
                        logger.info(f"✓ Added column to campaigns: {column_name}")
                    except Exception as e:
                        logger.error(f"✗ Failed to add column {column_name} to campaigns: {e}")
                        continue
        else:
            logger.info("✓ All campaigns table columns are present")
            
    except Exception as e:
        logger.error(f"✗ Campaign migration failed: {e}")

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
