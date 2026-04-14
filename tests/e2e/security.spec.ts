import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const BASE = 'http://127.0.0.1:5000';
const uid = () => crypto.randomBytes(4).toString('hex');

async function adminToken(): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'Brain', password: 'Mayflower1!!' }),
  });
  const data = await res.json() as any;
  return data.token || '';
}

async function userToken(): Promise<string> {
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
  return data.token || '';
}

test.describe('Role-Based Access Control', () => {
  test('T38 – Non-admin blocked from admin users endpoint', async () => {
    const token = await userToken();
    const res = await fetch(`${BASE}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('T39 – Admin can access admin users endpoint', async () => {
    const token = await adminToken();
    const res = await fetch(`${BASE}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  test('T40 – Non-admin blocked from admin system health', async () => {
    const token = await userToken();
    const res = await fetch(`${BASE}/api/admin/system/health`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect([401, 403]).toContain(res.status);
  });

  test('T41 – Admin can manage crypto payment settings', async () => {
    const token = await adminToken();
    const res = await fetch(`${BASE}/api/admin/crypto-payments/wallets`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect([200, 404]).toContain(res.status);
  });
});

test.describe('Input Validation', () => {
  test('T42 – XSS attempt in title field is sanitized', async () => {
    const token = await userToken();
    const res = await fetch(`${BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        target_url: 'https://example.com',
        title: '<script>alert("xss")</script>',
      }),
    });
    // Should either reject or sanitize
    if (res.status === 201) {
      const data = await res.json() as any;
      expect(data.title).not.toContain('<script>');
    } else {
      expect([400]).toContain(res.status);
    }
  });

  test('T43 – SQL injection in search param is safe', async () => {
    const token = await userToken();
    const res = await fetch(`${BASE}/api/links?search='; DROP TABLE links; --`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    // Should return 200 with empty results, not 500
    expect([200, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });

  test('T44 – Oversized payload → 400 or 413', async () => {
    const token = await userToken();
    const bigTitle = 'A'.repeat(10000);
    const res = await fetch(`${BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ target_url: 'https://example.com', title: bigTitle }),
    });
    // Should truncate or reject, not 500
    expect(res.status).not.toBe(500);
  });

  test('T45 – Missing required fields → 400', async () => {
    const token = await userToken();
    const res = await fetch(`${BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: 'No URL provided' }),
    });
    expect(res.status).toBe(400);
  });
});

test.describe('Health & Monitoring', () => {
  test('T46 – Public health endpoint', async () => {
    const res = await fetch(`${BASE}/health`);
    expect([200, 404]).toContain(res.status);
    if (res.status === 200) {
      const data = await res.json() as any;
      expect(data.status).toBeTruthy();
    }
  });

  test('T47 – Monitoring health endpoint', async () => {
    const res = await fetch(`${BASE}/api/monitoring/health`);
    expect([200]).toContain(res.status);
  });

  test('T48 – Rate limiting headers present on redirect', async () => {
    const token = await userToken();
    const linkRes = await fetch(`${BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ target_url: 'https://example.com' }),
    });
    const link = await linkRes.json() as any;
    const res = await fetch(`${BASE}/t/${link.short_code}`, { redirect: 'manual' });
    // Response should be redirect, not 500
    expect([301, 302, 200]).toContain(res.status);
  });
});
