-- ================================================================
-- Payment System Enhancement Migration
-- Created: November 12, 2025
-- Purpose: Complete crypto + Stripe payment system with admin controls
-- ================================================================

-- ================================================================
-- 1. CRYPTO PAYMENT TRANSACTIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS crypto_payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('pro', 'enterprise')),
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('BTC', 'ETH', 'USDT', 'LTC')),
    wallet_address TEXT NOT NULL,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    amount_crypto DECIMAL(20, 8) NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    screenshot_url TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verifying', 'confirmed', 'rejected')),
    verification_method VARCHAR(50) CHECK (verification_method IN ('manual', 'api_auto', 'semi_auto')),
    blockchain_confirmations INTEGER DEFAULT 0,
    verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user ON crypto_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_status ON crypto_payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_hash ON crypto_payment_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_created ON crypto_payment_transactions(created_at);

-- ================================================================
-- 2. PAYMENT API SETTINGS TABLE (Admin configurable)
-- ================================================================
CREATE TABLE IF NOT EXISTS payment_api_settings (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(100) NOT NULL UNIQUE,
    api_type VARCHAR(50) NOT NULL CHECK (api_type IN ('blockchain_verification', 'payment_gateway', 'other')),
    api_key TEXT,
    api_url TEXT,
    supported_currencies TEXT[],
    is_active BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    rate_limit_per_minute INTEGER DEFAULT 10,
    last_used_at TIMESTAMP,
    configuration JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_api_active ON payment_api_settings(is_active);
CREATE INDEX IF NOT EXISTS idx_payment_api_priority ON payment_api_settings(priority);

-- ================================================================
-- 3. CRYPTO WALLET ADDRESSES TABLE (Admin managed)
-- ================================================================
CREATE TABLE IF NOT EXISTS crypto_wallet_addresses (
    id SERIAL PRIMARY KEY,
    currency VARCHAR(10) NOT NULL UNIQUE CHECK (currency IN ('BTC', 'ETH', 'USDT', 'LTC', 'USDC', 'BNB')),
    wallet_address TEXT NOT NULL,
    network VARCHAR(50), -- mainnet, testnet, bsc, polygon, etc.
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crypto_wallets_active ON crypto_wallet_addresses(is_active);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_currency ON crypto_wallet_addresses(currency);

-- ================================================================
-- 4. SUBSCRIPTION PLANS TABLE (Pricing details)
-- ================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    plan_code VARCHAR(50) UNIQUE NOT NULL CHECK (plan_code IN ('free', 'pro', 'enterprise')),
    plan_name VARCHAR(100) NOT NULL,
    plan_description TEXT,
    price_monthly DECIMAL(10, 2),
    price_quarterly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    stripe_monthly_price_id VARCHAR(255),
    stripe_quarterly_price_id VARCHAR(255),
    stripe_yearly_price_id VARCHAR(255),
    features JSONB, -- Array of feature strings
    limits JSONB, -- {links_per_day: 10000, custom_domains: 5, api_calls: 5000}
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_plans_code ON subscription_plans(plan_code);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- ================================================================
-- 5. PAYMENT HISTORY TABLE (Unified payment tracking)
-- ================================================================
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('stripe', 'crypto', 'manual')),
    payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('subscription', 'upgrade', 'renewal', 'refund')),
    plan_type VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(50), -- monthly, quarterly, yearly
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    stripe_payment_intent_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    crypto_transaction_id INTEGER REFERENCES crypto_payment_transactions(id),
    receipt_url TEXT,
    invoice_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_method ON payment_history(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history(created_at);

-- ================================================================
-- 6. INSERT DEFAULT SUBSCRIPTION PLANS
-- ================================================================
INSERT INTO subscription_plans (plan_code, plan_name, plan_description, price_monthly, price_quarterly, price_yearly, features, limits, is_active, display_order)
VALUES 
(
    'free',
    'Free Plan',
    'Perfect for getting started with link tracking',
    0.00,
    0.00,
    0.00,
    '["10 links per day", "Basic analytics", "7-day data retention", "Community support", "Branding included"]'::jsonb,
    '{"links_per_day": 10, "custom_domains": 0, "api_calls": 0, "data_retention_days": 7, "team_members": 1}'::jsonb,
    true,
    1
),
(
    'pro',
    'Pro Plan',
    'Advanced features for professionals and growing businesses',
    29.00,
    79.00,
    299.00,
    '["10,000 links per day", "Advanced analytics with exports", "1-year data retention", "3 custom domains", "API access (5,000 calls/month)", "Priority email support", "Remove branding", "A/B testing", "QR code generation", "Geographic targeting", "Device targeting"]'::jsonb,
    '{"links_per_day": 10000, "custom_domains": 3, "api_calls": 5000, "data_retention_days": 365, "team_members": 3, "ab_tests": 10, "campaigns": 50}'::jsonb,
    true,
    2
),
(
    'enterprise',
    'Enterprise Plan',
    'Complete solution for large organizations with advanced needs',
    99.00,
    279.00,
    999.00,
    '["Unlimited links", "Advanced analytics + BI integrations", "Unlimited data retention", "10 custom domains", "API access (50,000 calls/month)", "Dedicated account manager", "24/7 priority support", "White-label solution", "Advanced A/B testing", "Team collaboration (up to 10 users)", "Custom integrations", "SLA guarantee (99.9% uptime)", "Advanced security features", "Webhook notifications", "Custom reporting"]'::jsonb,
    '{"links_per_day": -1, "custom_domains": 10, "api_calls": 50000, "data_retention_days": -1, "team_members": 10, "ab_tests": -1, "campaigns": -1, "sla_uptime": 99.9}'::jsonb,
    true,
    3
)
ON CONFLICT (plan_code) DO UPDATE SET
    plan_name = EXCLUDED.plan_name,
    plan_description = EXCLUDED.plan_description,
    price_monthly = EXCLUDED.price_monthly,
    price_quarterly = EXCLUDED.price_quarterly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    updated_at = CURRENT_TIMESTAMP;

-- ================================================================
-- 7. INSERT DEFAULT CRYPTO WALLET ADDRESSES (PLACEHOLDER)
-- ================================================================
INSERT INTO crypto_wallet_addresses (currency, wallet_address, network, is_active, notes)
VALUES 
    ('BTC', 'PLACEHOLDER_BTC_WALLET_ADDRESS', 'mainnet', false, 'Update with real wallet address in admin panel'),
    ('ETH', 'PLACEHOLDER_ETH_WALLET_ADDRESS', 'mainnet', false, 'Update with real wallet address in admin panel'),
    ('USDT', 'PLACEHOLDER_USDT_WALLET_ADDRESS', 'erc20', false, 'Update with real wallet address in admin panel'),
    ('LTC', 'PLACEHOLDER_LTC_WALLET_ADDRESS', 'mainnet', false, 'Update with real wallet address in admin panel')
ON CONFLICT (currency) DO NOTHING;

-- ================================================================
-- 8. INSERT DEFAULT PAYMENT API SETTINGS (PLACEHOLDER)
-- ================================================================
INSERT INTO payment_api_settings (api_name, api_type, api_url, supported_currencies, is_active, priority, configuration)
VALUES 
    ('BlockCypher', 'blockchain_verification', 'https://api.blockcypher.com/v1', ARRAY['BTC', 'LTC', 'ETH'], false, 1, '{"requires_api_key": true, "free_tier_limit": 200}'::jsonb),
    ('Etherscan', 'blockchain_verification', 'https://api.etherscan.io/api', ARRAY['ETH', 'USDT'], false, 2, '{"requires_api_key": true, "free_tier_limit": 5}'::jsonb),
    ('Blockchain.com', 'blockchain_verification', 'https://blockchain.info', ARRAY['BTC'], false, 3, '{"requires_api_key": false, "rate_limit": 10}'::jsonb)
ON CONFLICT (api_name) DO NOTHING;

-- ================================================================
-- 9. ADD NEW COLUMNS TO USERS TABLE (IF NOT EXISTS)
-- ================================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_plan_limits JSONB DEFAULT '{}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;

-- ================================================================
-- 10. UPDATE EXISTING SUBSCRIPTION_VERIFICATION TABLE
-- ================================================================
ALTER TABLE subscription_verification ADD COLUMN IF NOT EXISTS crypto_transaction_id INTEGER REFERENCES crypto_payment_transactions(id);
ALTER TABLE subscription_verification ADD COLUMN IF NOT EXISTS payment_history_id INTEGER REFERENCES payment_history(id);

-- ================================================================
-- END OF MIGRATION
-- ================================================================