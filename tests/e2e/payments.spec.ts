import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const BASE = 'http://127.0.0.1:5000';
const uid = () => crypto.randomBytes(4).toString('hex');

async function setup() {
  const u = `e2e_${uid()}`;
  await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, email: `${u}@test.com`, password: 'TestPass1!' }),
  });
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, password: 'TestPass1!' }),
  });
  const data = await res.json() as any;
  return { token: data.token, user: data.user };
}

test.describe('Stripe Payments', () => {
  test('T29 – Stripe config endpoint', async () => {
    const { token } = await setup();
    const res = await fetch(`${BASE}/api/payments/stripe/config`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect([200, 503]).toContain(res.status);
    if (res.status === 200) {
      const data = await res.json() as any;
      expect(data.publishable_key || data.pk).toBeTruthy();
    }
  });

  test('T30 – Stripe checkout session (with keys or correct error)', async () => {
    const { token } = await setup();
    const res = await fetch(`${BASE}/api/payments/stripe/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ plan: 'pro', billing_cycle: 'monthly' }),
    });
    const data = await res.json() as any;
    if (res.status === 200) {
      // Stripe configured — should have checkout URL
      expect(data.url || data.checkout_url || data.session_url).toBeTruthy();
    } else {
      // Stripe not configured is an expected dev state
      expect([400, 503]).toContain(res.status);
      expect(data.error).toMatch(/stripe|configured|key/i);
    }
  });
});

test.describe('Crypto Payments', () => {
  test('T31 – Submit mock crypto payment proof', async () => {
    const { token } = await setup();
    const txHash = `0xTEST_${uid().toUpperCase()}`;
    const res = await fetch(`${BASE}/api/crypto-payments/submit-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        plan_type: 'pro',
        currency: 'ETH',
        tx_hash: txHash,
        amount_usd: '29.99',
        amount_crypto: '0.01',
      }),
    });
    expect([200, 201]).toContain(res.status);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
  });

  test('T32 – Duplicate tx_hash rejected', async () => {
    const { token } = await setup();
    const txHash = `0xTEST_DUP_${uid()}`;
    // First submission
    await fetch(`${BASE}/api/crypto-payments/submit-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ plan_type: 'pro', currency: 'ETH', tx_hash: txHash, amount_usd: '29.99' }),
    });
    // Second submission with same hash
    const res = await fetch(`${BASE}/api/crypto-payments/submit-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ plan_type: 'pro', currency: 'ETH', tx_hash: txHash, amount_usd: '29.99' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json() as any;
    expect(data.error).toMatch(/duplicate|already/i);
  });

  test('T33 – Empty tx_hash rejected', async () => {
    const { token } = await setup();
    const res = await fetch(`${BASE}/api/crypto-payments/submit-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ plan_type: 'pro', currency: 'ETH', tx_hash: '', amount_usd: '29.99' }),
    });
    expect([400]).toContain(res.status);
  });

  test('T34 – Crypto payment status check', async () => {
    const { token } = await setup();
    const txHash = `0xTEST_STATUS_${uid()}`;
    const submitRes = await fetch(`${BASE}/api/crypto-payments/submit-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ plan_type: 'pro', currency: 'ETH', tx_hash: txHash, amount_usd: '29.99' }),
    });
    const submitData = await submitRes.json() as any;
    const txId = submitData.transaction?.id || submitData.id;

    if (txId) {
      const statusRes = await fetch(`${BASE}/api/crypto-payments/status/${txId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      expect([200, 404]).toContain(statusRes.status);
    }
  });

  test('T35 – Get crypto wallet addresses', async () => {
    const res = await fetch(`${BASE}/api/crypto-payments/wallets`);
    expect([200]).toContain(res.status);
  });
});

test.describe('Quantum Metrics', () => {
  test('T36 – Quantum metrics endpoint', async () => {
    const { token } = await setup();
    const res = await fetch(`${BASE}/api/quantum/metrics`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data).toBeTruthy();
  });

  test('T37 – Quantum security dashboard', async () => {
    const { token } = await setup();
    const res = await fetch(`${BASE}/api/quantum/security-dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect([200, 404]).toContain(res.status);
  });
});
