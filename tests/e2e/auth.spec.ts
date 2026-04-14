import { test, expect, Page } from '@playwright/test';
import crypto from 'crypto';

const BASE = 'http://127.0.0.1:5000';
const uid = () => crypto.randomBytes(4).toString('hex');

// Helper: register + login and return token via API
async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  const data = await res.json() as any;
  return data.token || '';
}

async function apiRegister(user: string, email: string, pass: string) {
  await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, email, password: pass, plan: 'free' }),
  });
}

test.describe('Authentication Flow', () => {
  test('T1 – Register new user → 201, status=active', async () => {
    const u = `e2e_${uid()}`;
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, email: `${u}@test.com`, password: 'TestPass1!', plan: 'free' }),
    });
    expect(res.status).toBe(201);
    const data = await res.json() as any;
    expect(data.user?.status).toBe('active');
    expect(data.user?.is_active).toBe(true);
  });

  test('T2 – Login returns JWT token', async () => {
    const u = `e2e_${uid()}`;
    await apiRegister(u, `${u}@test.com`, 'TestPass1!');
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: 'TestPass1!' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.token).toBeTruthy();
    expect(data.success).toBe(true);
  });

  test('T3 – Wrong password → 401', async () => {
    const u = `e2e_${uid()}`;
    await apiRegister(u, `${u}@test.com`, 'TestPass1!');
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: 'WrongPass99!' }),
    });
    expect(res.status).toBe(401);
  });

  test('T4 – Duplicate registration → 400', async () => {
    const u = `e2e_${uid()}`;
    await apiRegister(u, `${u}@test.com`, 'TestPass1!');
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, email: `${u}@test.com`, password: 'TestPass1!' }),
    });
    expect(res.status).toBe(400);
  });

  test('T5 – Weak password → 400', async () => {
    const u = `e2e_${uid()}`;
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, email: `${u}@test.com`, password: '1234' }),
    });
    expect(res.status).toBe(400);
  });

  test('T6 – Invalid email format → 400', async () => {
    const u = `e2e_${uid()}`;
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, email: 'not-an-email', password: 'TestPass1!' }),
    });
    expect(res.status).toBe(400);
  });

  test('T7 – No token → 401 on protected route', async () => {
    const res = await fetch(`${BASE}/api/links`);
    expect(res.status).toBe(401);
  });

  test('T8 – Fake token → 401', async () => {
    const res = await fetch(`${BASE}/api/links`, {
      headers: { 'Authorization': 'Bearer fake.token.invalid' },
    });
    expect(res.status).toBe(401);
  });

  test('T9 – Get current user profile', async () => {
    const u = `e2e_${uid()}`;
    await apiRegister(u, `${u}@test.com`, 'TestPass1!');
    const token = await apiLogin(u, 'TestPass1!');
    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.username).toBe(u);
  });
});
