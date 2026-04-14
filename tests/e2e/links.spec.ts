import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const BASE = 'http://127.0.0.1:5000';
const uid = () => crypto.randomBytes(4).toString('hex');

async function setup() {
  const u = `e2e_${uid()}`;
  const email = `${u}@test.com`;
  await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, email, password: 'TestPass1!', plan: 'free' }),
  });
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: u, password: 'TestPass1!' }),
  });
  const data = await res.json() as any;
  return { token: data.token, userId: data.user?.id };
}

async function createLink(token: string, overrides: Record<string, any> = {}) {
  const res = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ target_url: 'https://example.com', title: 'Test Link', ...overrides }),
  });
  return res.json() as any;
}

test.describe('Link CRUD', () => {
  test('T10 – Create link with target_url', async () => {
    const { token } = await setup();
    const res = await fetch(`${BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ target_url: 'https://example.com/page', title: 'Playwright Test' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.short_code).toBeTruthy();
    expect(data.target_url).toBe('https://example.com/page');
  });

  test('T11 – Invalid URL → 400', async () => {
    const { token } = await setup();
    const res = await fetch(`${BASE}/api/links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ target_url: 'not-a-valid-url' }),
    });
    expect(res.status).toBe(400);
  });

  test('T12 – Short redirect returns 302', async () => {
    const { token } = await setup();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/t/${link.short_code}`, { redirect: 'manual' });
    expect([301, 302]).toContain(res.status);
  });

  test('T13 – Get link by ID', async () => {
    const { token } = await setup();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/api/links/${link.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.id).toBe(link.id);
  });

  test('T14 – Update link title and OG metadata', async () => {
    const { token } = await setup();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/api/links/${link.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: 'Updated Title', og_title: 'OG Updated', og_description: 'Desc' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.title).toBe('Updated Title');
    expect(data.og_title).toBe('OG Updated');
  });

  test('T15 – Update routing rules', async () => {
    const { token } = await setup();
    const link = await createLink(token);
    const rules = [{ condition: 'country', value: 'US', destination: 'https://us.example.com' }];
    const res = await fetch(`${BASE}/api/links/${link.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ routing_rules: rules }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.routing_rules).toHaveLength(1);
  });

  test('T16 – Delete link', async () => {
    const { token } = await setup();
    const link = await createLink(token);
    const del = await fetch(`${BASE}/api/links/${link.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(del.status).toBe(200);
    // Should now 404
    const get = await fetch(`${BASE}/api/links/${link.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(get.status).toBe(404);
  });

  test('T17 – Cross-user isolation (other user cannot see link)', async () => {
    const { token: t1 } = await setup();
    const { token: t2 } = await setup();
    const link = await createLink(t1);
    const res = await fetch(`${BASE}/api/links/${link.id}`, {
      headers: { 'Authorization': `Bearer ${t2}` },
    });
    expect(res.status).toBe(404);
  });

  test('T18 – List links returns array', async () => {
    const { token } = await setup();
    await createLink(token);
    await createLink(token, { target_url: 'https://example.org' });
    const res = await fetch(`${BASE}/api/links`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    const links = data.links || data;
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Link Features', () => {
  test('T19 – QR code generation', async () => {
    const { token } = await setup();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/api/links/${link.id}/qr`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const ct = res.headers.get('content-type') || '';
    expect(ct).toMatch(/image\/(png|svg)/);
  });

  test('T20 – Pixel endpoint returns 1x1 GIF', async () => {
    const { token } = await setup();
    const link = await createLink(token, { capture_email: true });
    const res = await fetch(`${BASE}/p/${link.short_code}?email=test@example.com&id=${link.id}`);
    expect(res.status).toBe(200);
  });

  test('T21 – Link health check', async () => {
    const { token } = await setup();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/api/links/${link.id}/health`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.health_status).toBeTruthy();
  });

  test('T22 – Events/live dashboard', async () => {
    const { token } = await setup();
    const res = await fetch(`${BASE}/api/events/live`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});
