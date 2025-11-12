-- CRITICAL FIX #2: Complete Database Migration Script
-- ============================================================================
-- This script adds all missing columns and tables to align models with database
-- Run this on your production database BEFORE deploying new code

-- ============================================================================
-- PART 1: Add Missing Columns to Existing Tables
-- ============================================================================

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;

-- Add missing columns to tracking_events table (Quantum fields)
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS quantum_enabled BOOLEAN DEFAULT false;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS quantum_click_id VARCHAR(255);
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS quantum_stage VARCHAR(50);
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS quantum_processing_time FLOAT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS quantum_security_violation VARCHAR(100);
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS quantum_verified BOOLEAN DEFAULT false;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS quantum_final_url TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS quantum_error TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS quantum_security_score INTEGER;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS is_verified_human BOOLEAN DEFAULT false;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS country_code VARCHAR(10);
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS country_name VARCHAR(100);

-- Add missing columns to links table
ALTER TABLE links ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE links ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE links ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
ALTER TABLE links ADD COLUMN IF NOT EXISTS unique_clicks INTEGER DEFAULT 0;

-- ============================================================================
-- PART 2: Create Missing Tables
-- ============================================================================

-- Create blocked_ips table if not exists
CREATE TABLE IF NOT EXISTS blocked_ips (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    reason TEXT,
    blocked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    unblocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(is_active);

-- Create blocked_countries table if not exists
CREATE TABLE IF NOT EXISTS blocked_countries (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,
    reason TEXT,
    blocked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    unblocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocked_countries_code ON blocked_countries(country_code);
CREATE INDEX IF NOT EXISTS idx_blocked_countries_active ON blocked_countries(is_active);

-- Create crypto_wallet_addresses table if not exists
CREATE TABLE IF NOT EXISTS crypto_wallet_addresses (
    id SERIAL PRIMARY KEY,
    cryptocurrency VARCHAR(20) NOT NULL UNIQUE,
    wallet_address VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default crypto wallets
INSERT INTO crypto_wallet_addresses (cryptocurrency, wallet_address, is_active) VALUES
('BTC', 'Configure in Admin Panel', false),
('ETH', 'Configure in Admin Panel', false),
('LTC', 'Configure in Admin Panel', false),
('USDT', 'Configure in Admin Panel', false)
ON CONFLICT (cryptocurrency) DO NOTHING;

-- Create broadcast_messages table if not exists
CREATE TABLE IF NOT EXISTS broadcast_messages (
    id SERIAL PRIMARY KEY,
    sent_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'info',
    priority VARCHAR(50) DEFAULT 'medium',
    recipient_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcast_messages_sent_by ON broadcast_messages(sent_by);
CREATE INDEX IF NOT EXISTS idx_broadcast_messages_sent_at ON broadcast_messages(sent_at);

-- Create admin_settings table if not exists
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(setting_key);

-- Insert default admin settings
INSERT INTO admin_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'Brain Link Tracker', 'string', 'Application name', true),
('maintenance_mode', 'false', 'boolean', 'Maintenance mode status', false),
('max_links_per_user', '1000', 'integer', 'Maximum links per user', false),
('session_timeout', '3600', 'integer', 'Session timeout in seconds', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Create payment_history table if not exists
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    plan_type VARCHAR(50),
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_created_at ON payment_history(created_at);

-- ============================================================================
-- PART 3: Update Triggers for updated_at columns
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END;
$$;

-- ============================================================================
-- PART 4: Verification Queries
-- ============================================================================

-- Verify all tables exist
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Verify critical columns exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name IN ('quantum_enabled', 'avatar', 'reset_token', 'wallet_address')
ORDER BY table_name, column_name;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Database Migration Complete!';
    RAISE NOTICE 'All missing tables and columns have been added.';
    RAISE NOTICE 'Please verify the results above.';
    RAISE NOTICE '================================================================';
END $$;
