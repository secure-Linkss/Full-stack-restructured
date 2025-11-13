# Payment System Implementation Plan - Brain Link Tracker
**Date:** November 12, 2025
**Engineer:** Alex
**Goal:** Complete crypto + Stripe payment system with admin controls

---

## 1. CURRENT STATE ANALYSIS

### Existing Payment Infrastructure
✅ **Database Tables:**
- `users` table with subscription fields
- `subscription_verification` table (basic)
- `stripe_events` table for webhook logging

✅ **Backend Routes:**
- `api/routes/payments.py` - Basic payment logic
- `api/routes/crypto_payments.py` - Crypto wallet management
- `api/routes/stripe_payments.py` - Stripe integration

⚠️ **Gaps Identified:**
1. No dedicated `crypto_payments` table for transaction hash tracking
2. No `payment_verification_api_settings` table for admin-configurable APIs
3. Incomplete crypto payment flow (no hash verification)
4. Missing pricing plan details (Pro vs Enterprise features)
5. No comprehensive admin panel for payment management
6. Frontend payment UI needs enhancement

---

## 2. DATABASE SCHEMA ENHANCEMENTS

### New Tables Required:

#### A. crypto_payment_transactions
```sql
CREATE TABLE crypto_payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL,
    currency VARCHAR(10) NOT NULL, -- BTC, ETH, USDT, LTC
    wallet_address TEXT NOT NULL,
    transaction_hash VARCHAR(255) UNIQUE NOT NULL,
    amount_crypto DECIMAL(20, 8) NOT NULL,
    amount_usd DECIMAL(10, 2) NOT NULL,
    screenshot_url TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, verifying, confirmed, rejected
    verification_method VARCHAR(50), -- manual, api_auto
    blockchain_confirmations INTEGER DEFAULT 0,
    verified_by INTEGER REFERENCES users(id),
    verified_at TIMESTAMP,
    rejection_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### B. payment_api_settings (Admin configurable)
```sql
CREATE TABLE payment_api_settings (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(100) NOT NULL, -- blockcypher, etherscan, blockchain.com
    api_key TEXT,
    api_url TEXT,
    supported_currencies TEXT[], -- ['BTC', 'ETH', 'USDT']
    is_active BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 0,
    rate_limit_per_minute INTEGER DEFAULT 10,
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### C. crypto_wallet_addresses (Admin managed)
```sql
CREATE TABLE crypto_wallet_addresses (
    id SERIAL PRIMARY KEY,
    currency VARCHAR(10) NOT NULL UNIQUE, -- BTC, ETH, USDT, LTC
    wallet_address TEXT NOT NULL,
    qr_code_url TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### D. subscription_plans (Pricing details)
```sql
CREATE TABLE subscription_plans (
    id SERIAL PRIMARY KEY,
    plan_code VARCHAR(50) UNIQUE NOT NULL, -- free, pro, enterprise
    plan_name VARCHAR(100) NOT NULL,
    price_monthly DECIMAL(10, 2),
    price_quarterly DECIMAL(10, 2),
    price_yearly DECIMAL(10, 2),
    features JSONB, -- JSON array of features
    limits JSONB, -- {links_per_day: 10000, custom_domains: 5, etc}
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. PRICING PLAN STRUCTURE

### Free Plan
- **Price:** $0/month
- **Features:**
  - 10 links per day
  - Basic analytics
  - 7-day data retention
  - Community support
  - Branding included

### Pro Plan
- **Price:** $29/month, $79/quarter, $299/year
- **Features:**
  - 10,000 links per day
  - Advanced analytics with exports
  - 1-year data retention
  - 3 custom domains
  - API access (5,000 calls/month)
  - Priority email support
  - Remove branding
  - A/B testing
  - QR code generation
  - Geographic targeting
  - Device targeting

### Enterprise Plan
- **Price:** $99/month, $279/quarter, $999/year
- **Features:**
  - Unlimited links
  - Advanced analytics + BI integrations
  - Unlimited data retention
  - 10 custom domains
  - API access (50,000 calls/month)
  - Dedicated account manager
  - 24/7 priority support
  - White-label solution
  - Advanced A/B testing
  - Team collaboration (up to 10 users)
  - Custom integrations
  - SLA guarantee (99.9% uptime)
  - Advanced security features
  - Webhook notifications
  - Custom reporting

---

## 4. CRYPTO PAYMENT FLOW

### User Journey:
1. User selects plan (Pro/Enterprise) and billing cycle
2. User chooses "Pay with Crypto"
3. System displays wallet addresses for BTC, ETH, USDT, LTC
4. User sends payment to selected wallet
5. User submits transaction hash + optional screenshot
6. System status: "Pending Verification"
7. Admin reviews in admin panel OR auto-verification via API
8. If verified: User plan activated
9. If rejected: User notified with reason

### Admin Verification Options:
- **Manual:** Admin checks blockchain explorer, confirms payment
- **Semi-Auto:** System queries blockchain API, admin approves
- **Full Auto:** System auto-confirms after X blockchain confirmations

---

## 5. STRIPE PAYMENT FLOW

### User Journey:
1. User selects plan and billing cycle
2. User clicks "Pay with Card"
3. Stripe Checkout session created
4. User completes payment on Stripe
5. Webhook confirms payment
6. System activates subscription immediately
7. User redirected to dashboard

---

## 6. ADMIN PANEL ENHANCEMENTS

### Payment Management Section:
1. **Crypto Wallets Tab:**
   - Update BTC/ETH/USDT/LTC wallet addresses
   - Generate QR codes
   - View wallet balance (if API connected)

2. **Payment Verification Tab:**
   - List pending crypto payments
   - View transaction details
   - Check blockchain status
   - Approve/Reject with notes
   - Bulk actions

3. **API Settings Tab:**
   - Configure blockchain verification APIs
   - Add API keys (BlockCypher, Etherscan, etc.)
   - Set priority and rate limits
   - Test API connectivity

4. **Pricing Plans Tab:**
   - Edit plan features and prices
   - Enable/disable plans
   - View plan comparison

5. **Payment History Tab:**
   - All transactions (crypto + Stripe)
   - Filter by status, method, user
   - Export to CSV

---

## 7. USER SETTINGS ENHANCEMENTS

### Payment Section:
1. **Current Subscription:**
   - Plan name and status
   - Expiry date
   - Auto-renewal status (Stripe only)

2. **Upgrade/Downgrade:**
   - View available plans
   - Compare features
   - Select billing cycle
   - Choose payment method

3. **Payment History:**
   - Past transactions
   - Invoices/receipts
   - Download proof

4. **Crypto Payment Submission:**
   - Select currency
   - Copy wallet address
   - Submit transaction hash
   - Upload screenshot (optional)
   - Track verification status

---

## 8. IMPLEMENTATION CHECKLIST

### Phase 1: Database (Priority: CRITICAL)
- [ ] Create migration for new tables
- [ ] Add crypto_payment_transactions table
- [ ] Add payment_api_settings table
- [ ] Add crypto_wallet_addresses table
- [ ] Add subscription_plans table
- [ ] Seed initial data (plans, wallet addresses)

### Phase 2: Backend API (Priority: CRITICAL)
- [ ] Enhance crypto_payments.py routes
  - [ ] POST /api/crypto-payments/submit - Submit tx hash
  - [ ] GET /api/crypto-payments/status/:id - Check status
  - [ ] POST /api/crypto-payments/verify/:id - Admin verify
  - [ ] POST /api/crypto-payments/reject/:id - Admin reject
- [ ] Create payment_verification_service.py
  - [ ] Blockchain API integration
  - [ ] Auto-verification logic
- [ ] Enhance admin_settings.py routes
  - [ ] CRUD for wallet addresses
  - [ ] CRUD for API settings
  - [ ] CRUD for pricing plans
- [ ] Update user.py model with plan limits
- [ ] Create webhook handler for Stripe

### Phase 3: Frontend (Priority: HIGH)
- [ ] Create PaymentModal component
- [ ] Create CryptoPaymentForm component
- [ ] Create StripeCheckoutButton component
- [ ] Enhance Settings page payment section
- [ ] Create AdminPaymentPanel component
- [ ] Create PricingPlansManager component
- [ ] Add payment status notifications

### Phase 4: Testing (Priority: HIGH)
- [ ] Test crypto payment submission
- [ ] Test admin verification flow
- [ ] Test Stripe checkout flow
- [ ] Test plan upgrades/downgrades
- [ ] Test subscription expiry
- [ ] Test API verification

### Phase 5: Deployment (Priority: CRITICAL)
- [ ] Run database migrations
- [ ] Update environment variables
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Push to GitHub (main + master)

---

## 9. ENVIRONMENT VARIABLES NEEDED

```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENTERPRISE_PRICE_ID=price_...

# Blockchain APIs (Optional for auto-verification)
BLOCKCYPHER_API_KEY=...
ETHERSCAN_API_KEY=...
BLOCKCHAIN_COM_API_KEY=...

# Crypto Wallets (Initial - will be in DB)
BTC_WALLET_ADDRESS=...
ETH_WALLET_ADDRESS=...
USDT_WALLET_ADDRESS=...
LTC_WALLET_ADDRESS=...
```

---

## 10. SUCCESS CRITERIA

✅ **User Experience:**
- Users can select and pay for Pro/Enterprise plans
- Clear pricing comparison
- Smooth crypto payment submission
- Real-time payment status updates
- Instant activation for Stripe payments
- Fast verification for crypto (< 24 hours)

✅ **Admin Experience:**
- Easy wallet address management
- Quick payment verification
- API configuration without code changes
- Comprehensive payment history
- Bulk operations support

✅ **Technical:**
- All database tables created
- All API endpoints functional
- Frontend fully integrated
- No missing flows or blockers
- Production-ready code
- Successfully builds and deploys
- GitHub updated (main + master)

---

## 11. TIMELINE

- **Phase 1 (Database):** 1 hour
- **Phase 2 (Backend):** 2 hours
- **Phase 3 (Frontend):** 2 hours (compiled, may need rebuild)
- **Phase 4 (Testing):** 1 hour
- **Phase 5 (Deployment):** 30 minutes

**Total Estimated Time:** 6.5 hours

---

**Status:** Ready to implement
**Next Step:** Create database migration and new tables