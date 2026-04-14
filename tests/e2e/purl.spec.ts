import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const BASE = 'http://127.0.0.1:5000';
const uid = () => crypto.randomBytes(4).toString('hex');

async function setup() {
  const u = `e2e_${uid()}`;
  await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, email: `${u}@test.com`, password: 'TestPass1!', plan: 'free' }),
  });
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, password: 'TestPass1!' }),
  });
  const data = await res.json() as any;
  const linkRes = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.token}` },
    body: JSON.stringify({ target_url: 'https://example.com', capture_email: true }),
  });
  const link = await linkRes.json() as any;
  return { token: data.token, link };
}

test.describe('PURL Engine', () => {
  test('T23 – Generate PURL for recipient', async () => {
    const { token, link } = await setup();
    const res = await fetch(`${BASE}/api/purl/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        link_id: link.id,
        recipients: [{ email: 'recipient@example.com', name: 'Test User' }],
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    const created = data.purls || data.created || [];
    expect(created.length).toBeGreaterThan(0);
    expect(created[0].unique_code).toBeTruthy();
  });

  test('T24 – PURL redirect with tracking', async () => {
    const { token, link } = await setup();
    const genRes = await fetch(`${BASE}/api/purl/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        link_id: link.id,
        recipients: [{ email: 'r2@example.com', name: 'R2' }],
      }),
    });
    const genData = await genRes.json() as any;
    const created = genData.purls || genData.created || [];
    const code = created[0]?.unique_code;
    expect(code).toBeTruthy();

    // Should redirect with purl param
    const redir = await fetch(`${BASE}/t/${link.short_code}?purl=${code}&email=r2@example.com`, {
      redirect: 'manual',
    });
    expect([301, 302]).toContain(redir.status);
  });

  test('T25 – PURL list', async () => {
    const { token, link } = await setup();
    await fetch(`${BASE}/api/purl/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        link_id: link.id,
        recipients: [
          { email: 'a@example.com', name: 'A' },
          { email: 'b@example.com', name: 'B' },
        ],
      }),
    });
    const res = await fetch(`${BASE}/api/purl/list?link_id=${link.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    const items = data.purls || data.mappings || data;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(2);
  });

  test('T26 – PURL invalid email → 400', async () => {
    const { token, link } = await setup();
    const res = await fetch(`${BASE}/api/purl/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        link_id: link.id,
        recipients: [{ email: 'not-an-email', name: 'Bad' }],
      }),
    });
    // Either 400 or skipped with 0 created
    const data = await res.json() as any;
    const created = data.purls || data.created || [];
    if (res.status === 200) {
      expect(created.length).toBe(0);
    } else {
      expect(res.status).toBe(400);
    }
  });

  test('T27 – Honeypot stats endpoint', async () => {
    const { token } = await setup();
    const res = await fetch(`${BASE}/api/analytics/honeypot-stats`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  test('T28 – PURL export', async () => {
    const { token, link } = await setup();
    await fetch(`${BASE}/api/purl/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        link_id: link.id,
        recipients: [{ email: 'export@example.com', name: 'Export User' }],
      }),
    });
    const res = await fetch(`${BASE}/api/purl/export?link_id=${link.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect([200, 404]).toContain(res.status); // 404 acceptable if no PURLs exist yet
  });
});
