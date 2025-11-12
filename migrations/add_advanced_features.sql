- Advanced Features Migration
-- This migration adds support for A/B testing, API keys, custom slugs, link expiration,
-- Facebook Pixel, Slack notifications, and CDN integration

BEGIN;

-- 1. A/B Testing Tables
CREATE TABLE IF NOT EXISTS ab_tests (
    id SERIAL PRIMARY KEY,
    link_id INTEGER NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ab_test_variants (
    id SERIAL PRIMARY KEY,
    ab_test_id INTEGER NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_url VARCHAR(500) NOT NULL,
    traffic_percentage INTEGER DEFAULT 50 CHECK (traffic_percentage >= 0 AND traffic_percentage <= 100),
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    permissions TEXT
);

-- 3. Add new columns to links table for advanced features
ALTER TABLE links ADD COLUMN IF NOT EXISTS custom_slug VARCHAR(100) UNIQUE;
ALTER TABLE links ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE links ADD COLUMN IF NOT EXISTS expiration_action VARCHAR(20) DEFAULT 'redirect';
ALTER TABLE links ADD COLUMN IF NOT EXISTS expiration_redirect_url VARCHAR(500);
ALTER TABLE links ADD COLUMN IF NOT EXISTS facebook_pixel_id VARCHAR(50);
ALTER TABLE links ADD COLUMN IF NOT EXISTS enable_facebook_pixel BOOLEAN DEFAULT FALSE;
ALTER TABLE links ADD COLUMN IF NOT EXISTS ab_test_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE links ADD COLUMN IF NOT EXISTS ab_test_id INTEGER REFERENCES ab_tests(id) ON DELETE SET NULL;

-- 4. Add columns to users table for integrations
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_webhook_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_notifications_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cdn_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cdn_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cdn_provider VARCHAR(50);

-- 5. Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_custom_slug ON links(custom_slug) WHERE custom_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_links_expires_at ON links(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_links_status ON links(status);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ab_tests_link_id ON ab_tests(link_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_user_id ON ab_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);

CREATE INDEX IF NOT EXISTS idx_ab_test_variants_ab_test_id ON ab_test_variants(ab_test_id);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

CREATE INDEX IF NOT EXISTS idx_tracking_events_link_id ON tracking_events(link_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_is_bot ON tracking_events(is_bot);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_ab_tests_updated_at ON ab_tests;
CREATE TRIGGER update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_links_updated_at ON links;
CREATE TRIGGER update_links_updated_at
    BEFORE UPDATE ON links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_links_user_status ON links(user_id, status);
CREATE INDEX IF NOT EXISTS idx_links_user_created ON links(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_events_link_created ON tracking_events(link_id, created_at DESC);

COMMIT;