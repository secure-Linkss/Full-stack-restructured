-- Brain Link Tracker Database Schema
-- PostgreSQL Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'main_admin')),
    plan_type VARCHAR(50) DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
    avatar_url TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_end ON users(subscription_end_date);

-- ============================================
-- USER SESSIONS TABLE
-- ============================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device VARCHAR(255),
    ip_address VARCHAR(45),
    location VARCHAR(255),
    user_agent TEXT,
    is_current BOOLEAN DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- ============================================
-- DOMAINS TABLE
-- ============================================
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    domain VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    ssl_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_domains_active ON domains(is_active);
CREATE INDEX idx_domains_default ON domains(is_default);

-- ============================================
-- CAMPAIGNS TABLE
-- ============================================
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    target_url TEXT,
    budget DECIMAL(10, 2) DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created ON campaigns(created_at);

-- ============================================
-- TRACKING LINKS TABLE
-- ============================================
CREATE TABLE tracking_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
    campaign_name VARCHAR(255),
    slug VARCHAR(100) UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    preview_url TEXT,
    tracking_url TEXT NOT NULL,
    pixel_url TEXT NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired')),
    expiration_date TIMESTAMP WITH TIME ZONE,
    
    -- Capture Options
    capture_email BOOLEAN DEFAULT false,
    capture_password BOOLEAN DEFAULT false,
    
    -- Security Features
    bot_blocking_enabled BOOLEAN DEFAULT true,
    rate_limiting_enabled BOOLEAN DEFAULT false,
    dynamic_signature_enabled BOOLEAN DEFAULT false,
    mx_verification_enabled BOOLEAN DEFAULT false,
    block_repeat_clicks BOOLEAN DEFAULT false,
    
    -- Geo Targeting
    geo_targeting_enabled BOOLEAN DEFAULT false,
    geo_targeting_mode VARCHAR(20) CHECK (geo_targeting_mode IN ('allow', 'block')),
    allowed_countries TEXT[], -- Array of country codes
    blocked_countries TEXT[],
    allowed_cities TEXT[],
    blocked_cities TEXT[],
    allowed_regions TEXT[],
    blocked_regions TEXT[],
    
    -- Device Filtering
    device_filtering_enabled BOOLEAN DEFAULT false,
    allowed_devices TEXT[], -- ['desktop', 'mobile', 'tablet']
    blocked_devices TEXT[],
    
    -- Browser Filtering
    browser_filtering_enabled BOOLEAN DEFAULT false,
    allowed_browsers TEXT[], -- ['chrome', 'firefox', 'safari', etc.]
    blocked_browsers TEXT[],
    
    -- Advanced Options
    redirect_delay INTEGER DEFAULT 0, -- seconds
    
    -- Statistics
    total_clicks INTEGER DEFAULT 0,
    real_visitors INTEGER DEFAULT 0,
    blocked_attempts INTEGER DEFAULT 0,
    captured_emails_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_links_user_id ON tracking_links(user_id);
CREATE INDEX idx_links_campaign_id ON tracking_links(campaign_id);
CREATE INDEX idx_links_slug ON tracking_links(slug);
CREATE INDEX idx_links_status ON tracking_links(status);
CREATE INDEX idx_links_created ON tracking_links(created_at);

-- ============================================
-- CLICK EVENTS TABLE
-- ============================================
CREATE TABLE click_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES tracking_links(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Unique Identifier
    unique_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100),
    
    -- IP and Location
    ip_address VARCHAR(45),
    country VARCHAR(100),
    country_code VARCHAR(10),
    region VARCHAR(100),
    city VARCHAR(100),
    postal_code VARCHAR(20),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Device Information
    device VARCHAR(50), -- desktop, mobile, tablet
    device_model VARCHAR(100),
    device_vendor VARCHAR(100),
    
    -- Browser Information
    browser VARCHAR(100),
    browser_version VARCHAR(50),
    os VARCHAR(100),
    os_version VARCHAR(50),
    
    -- Network Information
    isp VARCHAR(255),
    connection_type VARCHAR(50),
    
    -- User Agent
    user_agent TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'redirected', 'on page', 'closed')),
    
    -- Bot Detection
    is_bot BOOLEAN DEFAULT false,
    bot_type VARCHAR(100),
    
    -- Referrer
    referrer TEXT,
    
    -- Session Duration
    session_duration INTEGER, -- seconds
    
    -- Timestamps
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    redirected_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_clicks_link_id ON click_events(link_id);
CREATE INDEX idx_clicks_unique_id ON click_events(unique_id);
CREATE INDEX idx_clicks_ip ON click_events(ip_address);
CREATE INDEX idx_clicks_country ON click_events(country_code);
CREATE INDEX idx_clicks_device ON click_events(device);
CREATE INDEX idx_clicks_browser ON click_events(browser);
CREATE INDEX idx_clicks_status ON click_events(status);
CREATE INDEX idx_clicks_is_bot ON click_events(is_bot);
CREATE INDEX idx_clicks_clicked_at ON click_events(clicked_at);

-- ============================================
-- CAPTURED DATA TABLE
-- ============================================
CREATE TABLE captured_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    link_id UUID NOT NULL REFERENCES tracking_links(id) ON DELETE CASCADE,
    click_event_id UUID REFERENCES click_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    
    -- Captured Information
    email VARCHAR(255),
    password_hash VARCHAR(255), -- Encrypted
    
    -- Additional Data
    ip_address VARCHAR(45),
    country VARCHAR(100),
    city VARCHAR(100),
    device VARCHAR(50),
    browser VARCHAR(100),
    
    -- Email Verification
    email_verified BOOLEAN DEFAULT false,
    mx_verified BOOLEAN DEFAULT false,
    
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_captured_link_id ON captured_data(link_id);
CREATE INDEX idx_captured_email ON captured_data(email);
CREATE INDEX idx_captured_campaign ON captured_data(campaign_id);
CREATE INDEX idx_captured_at ON captured_data(captured_at);

-- ============================================
-- API KEYS TABLE
-- ============================================
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL,
    key_prefix VARCHAR(20) NOT NULL, -- For display (e.g., "sk_live_abc...")
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);

-- ============================================
-- CRYPTO WALLETS TABLE
-- ============================================
CREATE TABLE crypto_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_type VARCHAR(50) NOT NULL CHECK (wallet_type IN ('BTC', 'ETH', 'USDT_TRC20', 'USDT_ERC20', 'BNB')),
    wallet_address VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_wallets_type ON crypto_wallets(wallet_type);
CREATE INDEX idx_wallets_active ON crypto_wallets(is_active);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'crypto')),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Stripe
    stripe_payment_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    
    -- Crypto
    crypto_type VARCHAR(50),
    crypto_address VARCHAR(255),
    crypto_transaction_hash VARCHAR(255),
    
    -- Plan Information
    plan_type VARCHAR(50),
    billing_period VARCHAR(50), -- monthly, yearly
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created ON payments(created_at);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- subscription_expiring, payment_received, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);

-- ============================================
-- TICKET MESSAGES TABLE
-- ============================================
CREATE TABLE ticket_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
    message TEXT NOT NULL,
    attachments JSONB, -- Array of attachment URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_created ON ticket_messages(created_at);

-- ============================================
-- SHORT LINKS TABLE
-- ============================================
CREATE TABLE short_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    short_url TEXT NOT NULL,
    clicks INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_short_links_user_id ON short_links(user_id);
CREATE INDEX idx_short_links_slug ON short_links(slug);
CREATE INDEX idx_short_links_active ON short_links(is_active);

-- ============================================
-- SECURITY EVENTS TABLE
-- ============================================
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- login_attempt, password_change, suspicious_activity, etc.
    severity VARCHAR(50) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address VARCHAR(45),
    location VARCHAR(255),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created ON security_events(created_at);

-- ============================================
-- SYSTEM CONFIGURATION TABLE
-- ============================================
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    data_type VARCHAR(50) DEFAULT 'string', -- string, boolean, integer, json
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_config_key ON system_config(key);

-- Insert default system configuration
INSERT INTO system_config (key, value, data_type, description) VALUES
('telegram_enabled', 'false', 'boolean', 'Enable Telegram notifications'),
('telegram_bot_token', '', 'string', 'Telegram bot token'),
('telegram_chat_id', '', 'string', 'Telegram chat ID for notifications'),
('stripe_enabled', 'false', 'boolean', 'Enable Stripe payments'),
('stripe_publishable_key', '', 'string', 'Stripe publishable key'),
('stripe_secret_key', '', 'string', 'Stripe secret key'),
('smtp_enabled', 'false', 'boolean', 'Enable SMTP email'),
('smtp_host', '', 'string', 'SMTP host'),
('smtp_port', '587', 'integer', 'SMTP port'),
('smtp_user', '', 'string', 'SMTP username'),
('smtp_password', '', 'string', 'SMTP password'),
('maintenance_mode', 'false', 'boolean', 'Enable maintenance mode'),
('enable_registrations', 'true', 'boolean', 'Allow new user registrations'),
('max_links_per_user', '100', 'integer', 'Maximum links per user'),
('company_name', 'Brain Link Tracker', 'string', 'Company name');

-- ============================================
-- ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100), -- user, link, campaign, etc.
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at BEFORE UPDATE ON domains
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracking_links_updated_at BEFORE UPDATE ON tracking_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crypto_wallets_updated_at BEFORE UPDATE ON crypto_wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check subscription expiry and send notifications
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id, email, subscription_end_date 
        FROM users 
        WHERE subscription_end_date IS NOT NULL
        AND subscription_end_date > CURRENT_TIMESTAMP
        AND subscription_end_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
        AND NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = users.id 
            AND type = 'subscription_expiring'
            AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
        )
    LOOP
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (
            user_record.id,
            'subscription_expiring',
            'Subscription Expiring Soon',
            'Your subscription will expire on ' || user_record.subscription_end_date::date || '. Please renew to continue using premium features.'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR ANALYTICS
-- ============================================

-- View for link statistics
CREATE OR REPLACE VIEW link_statistics AS
SELECT 
    tl.id,
    tl.slug,
    tl.campaign_name,
    tl.status,
    COUNT(DISTINCT ce.id) as total_clicks,
    COUNT(DISTINCT ce.ip_address) as unique_visitors,
    COUNT(DISTINCT CASE WHEN ce.is_bot = false THEN ce.id END) as real_clicks,
    COUNT(DISTINCT CASE WHEN ce.is_bot = true THEN ce.id END) as bot_clicks,
    COUNT(DISTINCT cd.id) as captured_emails,
    tl.created_at
FROM tracking_links tl
LEFT JOIN click_events ce ON tl.id = ce.link_id
LEFT JOIN captured_data cd ON tl.id = cd.link_id
GROUP BY tl.id, tl.slug, tl.campaign_name, tl.status, tl.created_at;

-- View for campaign performance
CREATE OR REPLACE VIEW campaign_performance AS
SELECT 
    c.id,
    c.name,
    c.status,
    COUNT(DISTINCT tl.id) as link_count,
    COUNT(DISTINCT ce.id) as total_clicks,
    COUNT(DISTINCT ce.ip_address) as unique_visitors,
    COUNT(DISTINCT cd.id) as captured_emails,
    CASE 
        WHEN COUNT(DISTINCT ce.id) > 0 
        THEN ROUND((COUNT(DISTINCT cd.id)::numeric / COUNT(DISTINCT ce.id)::numeric) * 100, 2)
        ELSE 0
    END as conversion_rate,
    c.created_at
FROM campaigns c
LEFT JOIN tracking_links tl ON c.id = tl.campaign_id
LEFT JOIN click_events ce ON tl.id = ce.link_id
LEFT JOIN captured_data cd ON tl.id = cd.link_id
GROUP BY c.id, c.name, c.status, c.created_at;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_clicks_link_clicked ON click_events(link_id, clicked_at);
CREATE INDEX idx_clicks_country_clicked ON click_events(country_code, clicked_at);
CREATE INDEX idx_captured_link_captured ON captured_data(link_id, captured_at);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'User accounts and authentication information';
COMMENT ON TABLE tracking_links IS 'Tracking links with all configuration options';
COMMENT ON TABLE click_events IS 'Individual click events with detailed tracking information';
COMMENT ON TABLE captured_data IS 'Captured emails and passwords from tracking links';
COMMENT ON TABLE campaigns IS 'Marketing campaigns grouping multiple tracking links';
COMMENT ON TABLE notifications IS 'User notifications including subscription expiry warnings';