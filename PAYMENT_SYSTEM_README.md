# Payment System Implementation - Brain Link Tracker

## Overview
This document describes the complete crypto and Stripe payment system implementation for Brain Link Tracker, including database schema, API endpoints, admin controls, and user flows.

---

## Database Schema

### New Tables Created

#### 1. `crypto_payment_transactions`
Tracks all cryptocurrency payment submissions and their verification status.

**Key Fields:**
- `transaction_hash` - Unique blockchain transaction identifier
- `status` - pending, verifying, confirmed, rejected
- `verification_method` - manual, api_auto, semi_auto
- `blockchain_confirmations` - Number of confirmations
- `verified_by` - Admin who verified the payment

#### 2. `crypto_wallet_addresses`
Admin-managed cryptocurrency wallet addresses for receiving payments.

**Key Fields:**
- `currency` - BTC, ETH, USDT, LTC
- `wallet_address` - The actual wallet address
- `network` - mainnet, testnet, etc.
- `is_active` - Whether this wallet is currently accepting payments

#### 3. `payment_api_settings`
Configuration for blockchain verification APIs (BlockCypher, Etherscan, etc.).

**Key Fields:**
- `api_name` - Name of the API service
- `api_key` - API authentication key (encrypted)
- `supported_currencies` - Array of supported cryptocurrencies
- `is_active` - Whether this API is enabled
- `priority` - Order of API usage for verification

#### 4. `subscription_plans`
Defines available subscription plans with pricing and features.

**Key Fields:**
- `plan_code` - free, pro, enterprise
- `price_monthly/quarterly/yearly` - Pricing for each billing cycle
- `features` - JSON array of plan features
- `limits` - JSON object with usage limits

#### 5. `payment_history`
Unified tracking of all payments (both Stripe and crypto).

**Key Fields:**
- `payment_method` - stripe, crypto, manual
- `payment_type` - subscription, upgrade, renewal, refund
- `status` - pending, completed, failed, refunded
- `crypto_transaction_id` - Links to crypto transaction if applicable

---

## Subscription Plans

### Free Plan ($0/month)
- 10 links per day
- Basic analytics
- 7-day data retention
- Community support
- Branding included

### Pro Plan ($29/month, $79/quarter, $299/year)
- 10,000 links per day
- Advanced analytics with exports
- 1-year data retention
- 3 custom domains
- API access (5,000 calls/month)
- Priority email support
- Remove branding
- A/B testing
- QR code generation
- Geographic & device targeting

### Enterprise Plan ($99/month, $279/quarter, $999/year)
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

## API Endpoints

### Public Endpoints

#### GET `/api/crypto-payments/wallets`
Get active crypto wallet addresses for payments.

**Response:**
```json
{
  "success": true,
  "wallets": [
    {
      "id": 1,
      "currency": "BTC",
      "wallet_address": "bc1q...",
      "network": "mainnet",
      "qr_code_url": "/images/Bitcoin.jpg",
      "is_active": true
    }
  ]
}
```

#### GET `/api/crypto-payments/plans`
Get available subscription plans with pricing.

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "plan_code": "pro",
      "plan_name": "Pro Plan",
      "pricing": {
        "monthly": 29.00,
        "quarterly": 79.00,
        "yearly": 299.00
      },
      "features": [...],
      "limits": {...}
    }
  ]
}
```

### User Endpoints (Requires Authentication)

#### POST `/api/crypto-payments/submit`
Submit crypto payment proof for verification.

**Request:**
```json
{
  "plan_type": "pro",
  "billing_cycle": "monthly",
  "currency": "BTC",
  "transaction_hash": "abc123...",
  "amount_crypto": 0.001,
  "amount_usd": 29.00,
  "screenshot": "base64_encoded_image"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment proof submitted successfully",
  "transaction_id": 123,
  "status": "pending"
}
```

#### GET `/api/crypto-payments/status`
Get user's crypto payment status.

#### GET `/api/crypto-payments/history`
Get user's complete payment history.

### Admin Endpoints (Requires Admin Role)

#### GET `/api/admin/crypto-payments/pending`
Get all pending crypto payment submissions.

**Response:**
```json
{
  "success": true,
  "pending_payments": [
    {
      "id": 123,
      "user": {
        "id": 456,
        "username": "john_doe",
        "email": "john@example.com"
      },
      "plan_type": "pro",
      "currency": "BTC",
      "transaction_hash": "abc123...",
      "amount_usd": 29.00,
      "status": "pending",
      "created_at": "2025-11-12T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### GET `/api/admin/crypto-payments/<transaction_id>`
Get detailed information about a specific payment.

#### POST `/api/admin/crypto-payments/<transaction_id>/verify`
Verify and approve a crypto payment.

**Request:**
```json
{
  "confirmations": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified. User john_doe upgraded to pro",
  "user_id": 456,
  "plan_type": "pro",
  "expiry_date": "2025-12-12T10:30:00Z"
}
```

#### POST `/api/admin/crypto-payments/<transaction_id>/reject`
Reject a crypto payment.

**Request:**
```json
{
  "reason": "Transaction not found on blockchain"
}
```

#### GET `/api/admin/crypto-wallets`
Get all crypto wallet addresses.

#### POST `/api/admin/crypto-wallets`
Create or update a crypto wallet address (Main Admin only).

**Request:**
```json
{
  "currency": "BTC",
  "wallet_address": "bc1q...",
  "network": "mainnet",
  "is_active": true,
  "notes": "Primary BTC wallet"
}
```

#### DELETE `/api/admin/crypto-wallets/<wallet_id>`
Delete a crypto wallet address (Main Admin only).

#### GET `/api/admin/payment-apis`
Get all payment API settings.

#### POST `/api/admin/payment-apis`
Create or update payment API configuration (Main Admin only).

**Request:**
```json
{
  "api_name": "BlockCypher",
  "api_type": "blockchain_verification",
  "api_key": "your_api_key",
  "api_url": "https://api.blockcypher.com/v1",
  "supported_currencies": ["BTC", "LTC", "ETH"],
  "is_active": true,
  "priority": 1,
  "rate_limit_per_minute": 10
}
```

#### DELETE `/api/admin/payment-apis/<api_id>`
Delete payment API configuration (Main Admin only).

#### GET `/api/admin/subscription-plans`
Get all subscription plans.

#### PUT `/api/admin/subscription-plans/<plan_id>`
Update subscription plan details (Main Admin only).

---

## User Payment Flow

### Crypto Payment Flow

1. **User selects plan:**
   - Navigate to Settings → Subscription
   - Choose Pro or Enterprise
   - Select billing cycle (monthly/quarterly/yearly)
   - Click "Pay with Crypto"

2. **View payment details:**
   - System displays wallet addresses for BTC, ETH, USDT, LTC
   - Shows exact amount to send
   - Displays QR code for easy scanning

3. **Make payment:**
   - User sends crypto to displayed wallet address
   - User copies transaction hash from wallet/exchange

4. **Submit proof:**
   - User pastes transaction hash
   - Optionally uploads screenshot
   - Submits for verification

5. **Wait for verification:**
   - User status changes to "crypto_pending"
   - User receives notification: "Payment submitted for review"
   - Admin receives notification to review payment

6. **Verification:**
   - Admin reviews transaction on blockchain
   - Admin approves or rejects with reason

7. **Activation:**
   - If approved: User plan activated immediately
   - User receives notification: "Payment confirmed! Plan active"
   - If rejected: User notified with reason, can resubmit

### Stripe Payment Flow

1. **User selects plan:**
   - Navigate to Settings → Subscription
   - Choose Pro or Enterprise
   - Select billing cycle
   - Click "Pay with Card"

2. **Stripe Checkout:**
   - Redirected to Stripe Checkout
   - Enters card details
   - Completes payment

3. **Webhook confirmation:**
   - Stripe sends webhook to backend
   - Backend verifies payment
   - User plan activated automatically

4. **Activation:**
   - User redirected to dashboard
   - Plan active immediately
   - Receives confirmation email

---

## Admin Panel Features

### Payment Management Dashboard

#### 1. Pending Payments Tab
- List of all pending crypto payments
- Quick view: User, Plan, Amount, Date
- Actions: View Details, Approve, Reject
- Bulk actions support

#### 2. Payment History Tab
- All transactions (crypto + Stripe)
- Filters: Status, Method, Date Range, User
- Export to CSV
- Search by transaction hash or user

#### 3. Crypto Wallets Tab
- Manage BTC, ETH, USDT, LTC wallet addresses
- Enable/disable wallets
- Generate QR codes
- View transaction count per wallet

#### 4. API Settings Tab
- Configure blockchain verification APIs
- Add API keys for BlockCypher, Etherscan, etc.
- Set priority and rate limits
- Test API connectivity
- View API usage statistics

#### 5. Pricing Plans Tab
- Edit plan features and pricing
- Enable/disable plans
- Set featured plans
- Reorder plan display
- View plan comparison

---

## Security Features

### Payment Security
1. **Transaction Hash Validation:**
   - Unique constraint prevents duplicate submissions
   - Hash format validation

2. **Admin Verification:**
   - Two-factor authentication required for admins
   - Audit logs for all payment actions
   - Role-based access (Main Admin vs Admin)

3. **API Key Protection:**
   - API keys encrypted in database
   - Only Main Admin can view/edit API keys
   - Rate limiting on API calls

4. **User Protection:**
   - Payment status tracking
   - Rejection reasons provided
   - Notification system for all payment events

---

## Configuration

### Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_QUARTERLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_QUARTERLY_PRICE_ID=price_...
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_...

# Blockchain APIs (Optional)
BLOCKCYPHER_API_KEY=...
ETHERSCAN_API_KEY=...
BLOCKCHAIN_COM_API_KEY=...
```

### Initial Setup

1. **Run Database Migration:**
```bash
psql $DATABASE_URL < migrations/005_payment_system_enhancement.sql
```

2. **Configure Wallet Addresses:**
- Login as Main Admin
- Navigate to Admin Panel → Crypto Wallets
- Add your real wallet addresses for each currency
- Enable wallets

3. **Configure Stripe:**
- Add Stripe API keys to environment variables
- Create products and prices in Stripe Dashboard
- Add price IDs to environment variables
- Set up webhook endpoint

4. **Optional: Configure Blockchain APIs:**
- Sign up for BlockCypher, Etherscan, etc.
- Add API keys in Admin Panel → API Settings
- Enable and set priority

---

## Testing Checklist

### User Flow Testing
- [ ] User can view subscription plans
- [ ] User can select plan and billing cycle
- [ ] Crypto wallet addresses display correctly
- [ ] User can submit transaction hash
- [ ] User receives confirmation notification
- [ ] User can view payment status
- [ ] User can view payment history

### Admin Flow Testing
- [ ] Admin can view pending payments
- [ ] Admin can view payment details
- [ ] Admin can approve payment
- [ ] Admin can reject payment with reason
- [ ] User plan activates correctly after approval
- [ ] User receives notifications
- [ ] Audit logs created correctly

### Wallet Management Testing
- [ ] Main Admin can add wallet addresses
- [ ] Main Admin can edit wallet addresses
- [ ] Main Admin can enable/disable wallets
- [ ] Public endpoint shows only active wallets
- [ ] QR codes generate correctly

### API Settings Testing
- [ ] Main Admin can add API configurations
- [ ] Main Admin can edit API keys
- [ ] API keys hidden from regular admins
- [ ] Priority system works correctly

### Stripe Integration Testing
- [ ] Checkout session creates correctly
- [ ] Payment processes successfully
- [ ] Webhook receives events
- [ ] User plan activates automatically
- [ ] Payment history records created

---

## Troubleshooting

### Common Issues

**Issue:** User submitted payment but admin can't see it
- Check if user is authenticated
- Verify transaction was committed to database
- Check admin notifications

**Issue:** Payment approved but user plan not activated
- Check user.subscription_end_date is set
- Verify user.status is 'active'
- Check user.plan_type matches approved plan

**Issue:** Stripe webhook not working
- Verify STRIPE_WEBHOOK_SECRET is correct
- Check webhook endpoint is accessible
- Review Stripe Dashboard webhook logs

**Issue:** Wallet addresses not showing
- Verify wallets are marked as is_active=true
- Check database has wallet records
- Ensure migration ran successfully

---

## Maintenance

### Regular Tasks

1. **Monitor Pending Payments:**
   - Check admin panel daily
   - Verify payments within 24 hours
   - Respond to user inquiries promptly

2. **Update Wallet Addresses:**
   - Rotate wallets periodically for security
   - Update QR codes when addresses change
   - Notify users of address changes

3. **Review Payment History:**
   - Export monthly reports
   - Reconcile with actual blockchain transactions
   - Monitor for suspicious activity

4. **Update Pricing:**
   - Review competitor pricing quarterly
   - Adjust plans as needed
   - Communicate changes to users

---

## Support

For issues or questions:
- Email: admin@brainlinktracker.com
- GitHub Issues: https://github.com/secure-Linkss/Full-stack-restructured/issues

---

**Last Updated:** November 12, 2025
**Version:** 1.0.0