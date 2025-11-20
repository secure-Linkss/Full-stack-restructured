-- Migration 006: Crypto Payment System Enhancement
-- Created: November 20, 2025
-- Purpose: Add missing crypto payment tables for admin crypto wallet management

-- ================================================================
-- CRYPTO WALLET ADDRESSES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS crypto_wallet_addresses (
    id SERIAL PRIMARY KEY,
    crypto_type VARCHAR(50) NOT NULL CHECK (crypto_type IN ('BTC', 'ETH', 'USDT', 'TRC20', 'BNB', 'LTC', 'XRP', 'DOGE', 'ADA', 'SOL')),
    wallet_address VARCHAR(255) NOT NULL UNIQUE,
    label VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    notes TEXT,
    qr_code_url TEXT,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crypto_wallets_type ON crypto_wallet_addresses(crypto_type);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_status ON crypto_wallet_addresses(status);

-- ================================================================
-- CRYPTO PAYMENT TRANSACTIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS crypto_payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    crypto_type VARCHAR(50) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL,
    amount_usd DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired')),
    admin_verified BOOLEAN DEFAULT false,
    admin_notes TEXT,
    verified_by INTEGER REFERENCES users(id),
    invoice_id VARCHAR(255),
    plan_type VARCHAR(50),
    subscription_duration VARCHAR(50),
    proof_image_url TEXT,
    blockchain_confirmations INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_crypto_transactions_user ON crypto_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_status ON crypto_payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_hash ON crypto_payment_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_crypto_transactions_created ON crypto_payment_transactions(created_at DESC);

-- ================================================================
-- PAYMENT API SETTINGS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS payment_api_settings (
    id SERIAL PRIMARY KEY,
    provider VARCHAR(50) NOT NULL UNIQUE CHECK (provider IN ('stripe', 'paypal', 'coinbase', 'binance')),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    webhook_secret TEXT,
    publishable_key TEXT,
    is_enabled BOOLEAN DEFAULT false,
    test_mode BOOLEAN DEFAULT true,
    configuration JSONB,
    last_tested TIMESTAMP,
    test_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_api_provider ON payment_api_settings(provider);

-- ================================================================
-- PAYMENT HISTORY TABLE (Enhanced)
-- ================================================================
CREATE TABLE IF NOT EXISTS payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) CHECK (payment_method IN ('stripe', 'crypto', 'paypal', 'manual')),
    transaction_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
    plan_type VARCHAR(50),
    subscription_duration VARCHAR(50),
    description TEXT,
    metadata JSONB,
    stripe_invoice_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    crypto_transaction_id INTEGER REFERENCES crypto_payment_transactions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_history_user ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_method ON payment_history(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_history_created ON payment_history(created_at DESC);

-- ================================================================
-- SUBSCRIPTION INVOICES TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS subscription_invoices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    payment_method VARCHAR(50),
    payment_history_id INTEGER REFERENCES payment_history(id),
    plan_type VARCHAR(50),
    billing_period_start TIMESTAMP,
    billing_period_end TIMESTAMP,
    due_date TIMESTAMP,
    paid_at TIMESTAMP,
    invoice_pdf_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON subscription_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON subscription_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON subscription_invoices(invoice_number);

-- ================================================================
-- SUBSCRIPTION PLANS TABLE (Enhanced)
-- ================================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2),
    price_quarterly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    features JSONB,
    limits JSONB,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_quarterly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_plans_slug ON subscription_plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_active ON subscription_plans(is_active);

-- ================================================================
-- Insert Default Crypto Wallets (Example - Replace with real addresses)
-- ================================================================
INSERT INTO crypto_wallet_addresses (crypto_type, wallet_address, label, status, is_default) VALUES
('BTC', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'Main Bitcoin Wallet', 'active', true),
('ETH', '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'Main Ethereum Wallet', 'active', true),
('USDT', 'TXYZopYRdj2D9XRtbG4uqeCKPm5kB7FqCg', 'USDT TRC20 Wallet', 'active', true)
ON CONFLICT (wallet_address) DO NOTHING;

-- ================================================================
-- Insert Default Subscription Plans
-- ================================================================
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_quarterly, price_yearly, features, limits, is_active, is_featured, sort_order) VALUES
('Free', 'free', 'Perfect for getting started', 0.00, 0.00, 0.00, 
 '["100 links per month", "Basic analytics", "Email support"]'::jsonb,
 '{"links": 100, "clicks": 10000, "storage": "1GB"}'::jsonb,
 true, false, 1),
('Pro', 'pro', 'For growing businesses', 29.99, 79.99, 299.99,
 '["Unlimited links", "Advanced analytics", "Priority support", "Custom domains", "API access"]'::jsonb,
 '{"links": -1, "clicks": -1, "storage": "50GB"}'::jsonb,
 true, true, 2),
('Enterprise', 'enterprise', 'For large organizations', 99.99, 269.99, 999.99,
 '["Everything in Pro", "Dedicated support", "SLA guarantee", "Custom integrations", "White-label"]'::jsonb,
 '{"links": -1, "clicks": -1, "storage": "500GB"}'::jsonb,
 true, false, 3)
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- Add missing columns to existing tables if needed
-- ================================================================
DO $$ 
BEGIN
    -- Add crypto payment columns to users table if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='crypto_payment_pending') THEN
        ALTER TABLE users ADD COLUMN crypto_payment_pending BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pending_crypto_transaction_id') THEN
        ALTER TABLE users ADD COLUMN pending_crypto_transaction_id INTEGER REFERENCES crypto_payment_transactions(id);
    END IF;
END $$;

-- ================================================================
-- Create function to auto-expire pending crypto transactions
-- ================================================================
CREATE OR REPLACE FUNCTION expire_pending_crypto_transactions()
RETURNS void AS $$
BEGIN
    UPDATE crypto_payment_transactions
    SET status = 'expired'
    WHERE status = 'pending'
    AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- Create function to update user subscription after payment
-- ================================================================
CREATE OR REPLACE FUNCTION process_crypto_payment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
        -- Update user subscription
        UPDATE users
        SET 
            plan_type = NEW.plan_type,
            status = 'active',
            subscription_start_date = CURRENT_TIMESTAMP,
            subscription_end_date = CASE 
                WHEN NEW.subscription_duration = 'weekly' THEN CURRENT_TIMESTAMP + INTERVAL '7 days'
                WHEN NEW.subscription_duration = 'biweekly' THEN CURRENT_TIMESTAMP + INTERVAL '14 days'
                WHEN NEW.subscription_duration = 'monthly' THEN CURRENT_TIMESTAMP + INTERVAL '30 days'
                WHEN NEW.subscription_duration = 'quarterly' THEN CURRENT_TIMESTAMP + INTERVAL '90 days'
                WHEN NEW.subscription_duration = 'yearly' THEN CURRENT_TIMESTAMP + INTERVAL '365 days'
                ELSE CURRENT_TIMESTAMP + INTERVAL '30 days'
            END,
            crypto_payment_pending = false,
            pending_crypto_transaction_id = NULL
        WHERE id = NEW.user_id;
        
        -- Create payment history record
        INSERT INTO payment_history (
            user_id, payment_method, transaction_id, amount, status,
            plan_type, subscription_duration, crypto_transaction_id, completed_at
        ) VALUES (
            NEW.user_id, 'crypto', NEW.transaction_hash, NEW.amount_usd, 'completed',
            NEW.plan_type, NEW.subscription_duration, NEW.id, CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for crypto payment confirmation
DROP TRIGGER IF EXISTS trigger_crypto_payment_confirmation ON crypto_payment_transactions;
CREATE TRIGGER trigger_crypto_payment_confirmation
AFTER UPDATE ON crypto_payment_transactions
FOR EACH ROW
EXECUTE FUNCTION process_crypto_payment_confirmation();

-- ================================================================
-- Grant permissions (adjust as needed for your setup)
-- ================================================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMIT;