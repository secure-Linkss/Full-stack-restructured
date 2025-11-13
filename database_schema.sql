-- Complete Enhanced Database Schema for Brain Link Tracker
-- Created: November 8, 2025
-- Updated: November 12, 2025 - Added contact_submissions table
-- This file contains ALL tables needed for the application including new payment features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- USERS TABLE - Core user accounts
-- ================================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('main_admin', 'admin', 'member')),
    plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'weekly', 'biweekly', 'monthly', 'quarterly', 'pro', 'enterprise')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(50),
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    subscription_expiry TIMESTAMP,
    phone VARCHAR(20),
    country VARCHAR(100),
    telegram_chat_id VARCHAR(255),
    telegram_enabled BOOLEAN DEFAULT false,
    telegram_bot_token VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login TIMESTAMP,
    last_ip VARCHAR(45),
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'expired', 'crypto_pending')),
    daily_link_limit INTEGER DEFAULT 100,
    daily_link_count INTEGER DEFAULT 0,
    last_link_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ================================================================
-- CAMPAIGNS TABLE - Marketing campaigns
-- ================================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    budget DECIMAL(10, 2),
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    revenue DECIMAL(10, 2) DEFAULT 0,
    cost_per_click DECIMAL(10, 4),
    roi DECIMAL(10, 2),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- ================================================================
-- LINKS TABLE - Tracking links
-- ================================================================
CREATE TABLE IF NOT EXISTS links (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,
    original_url TEXT NOT NULL,
    short_code VARCHAR(50) UNIQUE NOT NULL,
    short_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    click_limit INTEGER,
    click_count INTEGER DEFAULT 0,
    unique_clicks INTEGER DEFAULT 0,
    last_clicked_at TIMESTAMP,
    qr_code_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_links_user ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_campaign ON links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links(created_at);

-- ================================================================
-- TRACKING_EVENTS TABLE - Click tracking data
-- ================================================================
CREATE TABLE IF NOT EXISTS tracking_events (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    referer TEXT,
    country VARCHAR(100),
    country_code VARCHAR(10),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    device_type VARCHAR(50),
    device_brand VARCHAR(100),
    device_model VARCHAR(100),
    os VARCHAR(100),
    os_version VARCHAR(50),
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    is_mobile BOOLEAN DEFAULT false,
    is_bot BOOLEAN DEFAULT false,
    is_unique BOOLEAN DEFAULT false,
    conversion_value DECIMAL(10, 2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_link ON tracking_events(link_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_user ON tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at);
CREATE INDEX IF NOT EXISTS idx_tracking_events_country ON tracking_events(country);

-- ================================================================
-- NOTIFICATIONS TABLE - User notifications
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ================================================================
-- AUDIT_LOGS TABLE - Admin activity tracking
-- ================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    target_type VARCHAR(100),
    target_id INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

-- ================================================================
-- SECURITY_THREATS TABLE - Security monitoring
-- ================================================================
CREATE TABLE IF NOT EXISTS security_threats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    threat_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_positive')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    description TEXT,
    resolution_notes TEXT,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_threats_user ON security_threats(user_id);
CREATE INDEX IF NOT EXISTS idx_security_threats_status ON security_threats(status);
CREATE INDEX IF NOT EXISTS idx_security_threats_severity ON security_threats(severity);

-- ================================================================
-- BLOCKED_IPS TABLE - IP blocking
-- ================================================================
CREATE TABLE IF NOT EXISTS blocked_ips (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    reason TEXT,
    blocked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    unblocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON blocked_ips(is_active);

-- ================================================================
-- BLOCKED_COUNTRIES TABLE - Country blocking
-- ================================================================
CREATE TABLE IF NOT EXISTS blocked_countries (
    id SERIAL PRIMARY KEY,
    country_code VARCHAR(10) NOT NULL UNIQUE,
    country_name VARCHAR(100) NOT NULL,
    reason TEXT,
    blocked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    unblocked_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_blocked_countries_code ON blocked_countries(country_code);
CREATE INDEX IF NOT EXISTS idx_blocked_countries_active ON blocked_countries(is_active);

-- ================================================================
-- SUPPORT_TICKETS TABLE - Support system
-- ================================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'reopened')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    last_reply_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- ================================================================
-- SUPPORT_TICKET_MESSAGES TABLE - Messages within a ticket
-- ================================================================
CREATE TABLE IF NOT EXISTS support_ticket_messages (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_staff_reply BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON support_ticket_messages(created_at);

-- ================================================================
-- DOMAINS TABLE - Custom domains for link shortening
-- ================================================================
CREATE TABLE IF NOT EXISTS domains (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_domains_user ON domains(user_id);
CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(domain_name);

-- ================================================================
-- SECURITY_SETTINGS TABLE - Global security configuration
-- ================================================================
CREATE TABLE IF NOT EXISTS security_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    setting_name VARCHAR(255) NOT NULL,
    setting_value TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, setting_name)
);

CREATE INDEX IF NOT EXISTS idx_security_settings_user ON security_settings(user_id);

-- ================================================================
-- SUBSCRIPTION_VERIFICATION TABLE - For manual payment verification
-- ================================================================
CREATE TABLE IF NOT EXISTS subscription_verification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    proof_url TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    rejection_reason TEXT,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_verification_user ON subscription_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_sub_verification_status ON subscription_verification(status);

-- ================================================================
-- API_KEYS TABLE - For API access
-- ================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- ================================================================
-- ADMIN_SETTINGS TABLE - Global admin settings
-- ================================================================
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_name VARCHAR(255) NOT NULL UNIQUE,
    setting_value TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================================================
-- AB_TESTS TABLE - For A/B testing features
-- ================================================================
CREATE TABLE IF NOT EXISTS ab_tests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    control_group_size INTEGER DEFAULT 0,
    variant_group_size INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ab_tests_status ON ab_tests(status);

-- ================================================================
-- AB_TEST_PARTICIPANTS TABLE - Users participating in A/B tests
-- ================================================================
CREATE TABLE IF NOT EXISTS ab_test_participants (
    id SERIAL PRIMARY KEY,
    ab_test_id INTEGER REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    variant VARCHAR(50) NOT NULL CHECK (variant IN ('control', 'variant_a', 'variant_b', 'variant_c')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ab_test_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ab_participants_test_user ON ab_test_participants(ab_test_id, user_id);

-- ================================================================
-- STRIPE_EVENTS TABLE - To log Stripe webhook events
-- ================================================================
CREATE TABLE IF NOT EXISTS stripe_events (
    id SERIAL PRIMARY KEY,
    stripe_event_id VARCHAR(255) NOT NULL UNIQUE,
    event_type VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_id ON stripe_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON stripe_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON stripe_events(processed);

-- ================================================================
-- QUANTUM_REDIRECT_LOGS TABLE - For advanced redirect tracking
-- ================================================================
CREATE TABLE IF NOT EXISTS quantum_redirect_logs (
    id SERIAL PRIMARY KEY,
    link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    redirect_type VARCHAR(50) NOT NULL,
    target_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quantum_logs_link ON quantum_redirect_logs(link_id);
CREATE INDEX IF NOT EXISTS idx_quantum_logs_created_at ON quantum_redirect_logs(created_at);

-- ================================================================
-- ADVANCED_SECURITY_LOGS TABLE - Detailed security events
-- ================================================================
CREATE TABLE IF NOT EXISTS advanced_security_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) DEFAULT 'medium',
    ip_address VARCHAR(45),
    user_agent TEXT,
    details TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_adv_security_logs_user ON advanced_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_adv_security_logs_type ON advanced_security_logs(event_type);

-- ================================================================
-- BROADCASTER_MESSAGES TABLE - For system-wide announcements
-- ================================================================
CREATE TABLE IF NOT EXISTS broadcaster_messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    target_role VARCHAR(50) DEFAULT 'all' CHECK (target_role IN ('all', 'member', 'admin', 'main_admin')),
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_broadcaster_messages_active ON broadcaster_messages(is_active);

-- ================================================================
-- PENDING_USERS TABLE - For users awaiting admin approval
-- ================================================================
CREATE TABLE IF NOT EXISTS pending_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    requested_plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_users_status ON pending_users(status);

-- ================================================================
-- PAGE_TRACKING_EVENTS TABLE - For tracking page views
-- ================================================================
CREATE TABLE IF NOT EXISTS page_tracking_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    page_url TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    session_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_page_tracking_user ON page_tracking_events(user_id);
CREATE INDEX IF NOT EXISTS idx_page_tracking_url ON page_tracking_events(page_url);
CREATE INDEX IF NOT EXISTS idx_page_tracking_session ON page_tracking_events(session_id);

-- ================================================================
-- GEOSPATIAL_DATA TABLE - For storing and caching geo-ip data
-- ================================================================
CREATE TABLE IF NOT EXISTS geospatial_data (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    country VARCHAR(100),
    country_code VARCHAR(10),
    city VARCHAR(100),
    region VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    isp VARCHAR(255),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geospatial_ip ON geospatial_data(ip_address);

-- ================================================================
-- TELEGRAM_NOTIFICATIONS TABLE - For Telegram integration logs
-- ================================================================
CREATE TABLE IF NOT EXISTS telegram_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    chat_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'queued')),
    failure_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telegram_user ON telegram_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_status ON telegram_notifications(status);

-- ================================================================
-- AB_TEST_EVENTS TABLE - For tracking events within A/B tests
-- ================================================================
CREATE TABLE IF NOT EXISTS ab_test_events (
    id SERIAL PRIMARY KEY,
    ab_test_id INTEGER REFERENCES ab_tests(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_value DECIMAL(10, 2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ab_event_test_user ON ab_test_events(ab_test_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ab_event_name ON ab_test_events(event_name);

-- ================================================================
-- USER_SETTINGS TABLE - For user-specific preferences
-- ================================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, setting_key)
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);

-- ================================================================
-- CONTACT_SUBMISSIONS TABLE - For contact form submissions
-- ================================================================
CREATE TABLE IF NOT EXISTS contact_submissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'archived')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_notes TEXT,
    resolved_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at);

-- ================================================================
-- END OF SCHEMA
-- ================================================================