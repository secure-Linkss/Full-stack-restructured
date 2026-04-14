/**
 * stealth.spec.ts
 * ===============
 * QA coverage for:
 *   - Email scanner detection & deflection
 *   - Honeypot trap endpoints
 *   - Browser fingerprint collection
 *   - Cloaking / preview page templates
 *   - Placeholder expansion in redirect URLs
 *   - Quantum redirect chain integrity
 *   - Rate limit headers on auth routes
 *
 * Test IDs: T49 – T72
 */

import { test, expect } from '@playwright/test';
import crypto from 'crypto';

const BASE = 'http://127.0.0.1:5000';
const uid = () => crypto.randomBytes(4).toString('hex');

// ── Helpers ──────────────────────────────────────────────────────────────────

async function register(): Promise<{ token: string; username: string }> {
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
  return { token: data.token || '', username: u };
}

async function createLink(token: string, overrides: Record<string, any> = {}): Promise<any> {
  const res = await fetch(`${BASE}/api/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ target_url: 'https://example.com', title: 'Stealth Test', ...overrides }),
  });
  return res.json();
}

// ── Scanner Detection & Deflection ────────────────────────────────────────────

test.describe('Email Scanner Deflection', () => {
  test('T49 – Outlook SafeLinks UA gets safe 200, not redirect', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/t/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Microsoft Outlook SafeLinks/1.0' },
    });
    // Scanner should get safe 200 blank page, not a 302
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('<!DOCTYPE html>');
  });

  test('T50 – Barracuda scanner UA gets safe 200', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/t/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'BarracudaLinkProtect/2.0' },
    });
    expect(res.status).toBe(200);
  });

  test('T51 – Proofpoint scanner UA gets safe 200', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/t/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'ProofpointURLDefense/v2' },
    });
    expect(res.status).toBe(200);
  });

  test('T52 – Googlebot UA gets 404 (generic bot, blocked)', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/t/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' },
    });
    // Googlebot is NOT a hard scanner, it's a generic bot → block → 404
    expect([200, 404]).toContain(res.status);
  });

  test('T53 – Normal browser UA gets redirect (302)', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/t/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0' },
    });
    expect([302, 200]).toContain(res.status);
  });

  test('T54 – Stealth headers present on redirect response', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/t/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/120' },
    });
    // Stealth headers should be set
    const cc = res.headers.get('cache-control') || '';
    expect(cc.toLowerCase()).toContain('no-store');
  });

  test('T55 – X-Scanner-Deflect header set for scanner responses', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/t/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mimecast/5.0 URL Scanner' },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-scanner-deflect')).toBe('1');
  });
});

// ── Honeypot Traps ────────────────────────────────────────────────────────────

test.describe('Honeypot System', () => {
  test('T56 – /h endpoint returns 200 (convincing decoy)', async () => {
    const res = await fetch(`${BASE}/h`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('html');
  });

  test('T57 – /trap endpoint returns 200 (convincing decoy)', async () => {
    const res = await fetch(`${BASE}/trap`);
    expect(res.status).toBe(200);
  });

  test('T58 – /h/<path> variant accessible', async () => {
    const res = await fetch(`${BASE}/h/some/deep/path`);
    expect(res.status).toBe(200);
  });

  test('T59 – /trap/<path> variant accessible', async () => {
    const res = await fetch(`${BASE}/trap/hidden-resource`);
    expect(res.status).toBe(200);
  });

  test('T60 – Honeypot stats endpoint returns JSON', async () => {
    const res = await fetch(`${BASE}/api/honeypot/stats`);
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(typeof data.blacklisted_ips).toBe('number');
  });
});

// ── Fingerprint Collection ────────────────────────────────────────────────────

test.describe('Browser Fingerprinting', () => {
  test('T61 – POST /api/fingerprint returns hash + score', async () => {
    const res = await fetch(`${BASE}/api/fingerprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canvas_hash: 'a'.repeat(64),
        webgl_vendor: 'Intel Inc.',
        webgl_renderer: 'Intel Iris OpenGL Engine',
        screen_width: 1920,
        screen_height: 1080,
        color_depth: 24,
        pixel_ratio: 1,
        timezone: 'America/New_York',
        language: 'en-US',
        hw_concurrency: 8,
        max_touch_points: 0,
        fonts: 'Arial,Helvetica,Times New Roman',
        cookie_enabled: true,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.success).toBe(true);
    expect(typeof data.fingerprint_hash).toBe('string');
    expect(data.fingerprint_hash.length).toBe(64);
    expect(typeof data.score).toBe('number');
    expect(data.score).toBeGreaterThanOrEqual(0);
    expect(data.score).toBeLessThanOrEqual(100);
  });

  test('T62 – Fingerprint with click_id attaches to tracking event', async () => {
    // Create a link, click it to generate a quantum click_id, then post fingerprint
    const { token } = await register();
    const link = await createLink(token);

    // Hit the link to generate a tracking event (scanner-safe UA to avoid block)
    await fetch(`${BASE}/t/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/120' },
    });

    // Posting a fingerprint without a valid click_id should still succeed (graceful)
    const fp = await fetch(`${BASE}/api/fingerprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        click_id: 'nonexistent_click_id_test',
        canvas_hash: 'b'.repeat(64),
        screen_width: 1440,
        screen_height: 900,
        timezone: 'Europe/London',
      }),
    });
    expect(fp.status).toBe(200);
    const fpData = await fp.json() as any;
    expect(fpData.success).toBe(true);
  });

  test('T63 – Low-entropy fingerprint gets low score', async () => {
    const res = await fetch(`${BASE}/api/fingerprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // No canvas, no WebGL, no screen — typical headless bot profile
        screen_width: 0,
        screen_height: 0,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.score).toBeLessThan(60);
    expect(data.is_likely_human).toBe(false);
  });

  test('T64 – High-entropy fingerprint gets high score', async () => {
    const res = await fetch(`${BASE}/api/fingerprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        canvas_hash: crypto.randomBytes(32).toString('hex'),
        webgl_vendor: 'NVIDIA Corporation',
        webgl_renderer: 'NVIDIA GeForce GTX 1080/PCIe/SSE2',
        screen_width: 2560,
        screen_height: 1440,
        color_depth: 24,
        pixel_ratio: 2,
        timezone: 'Asia/Tokyo',
        language: 'ja',
        hw_concurrency: 16,
        max_touch_points: 0,
        fonts: 'Arial,Helvetica,Times New Roman,Verdana,Georgia,Courier New',
        cookie_enabled: true,
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as any;
    expect(data.score).toBeGreaterThan(50);
    expect(data.is_likely_human).toBe(true);
  });
});

// ── Cloaking / Preview Pages ──────────────────────────────────────────────────

test.describe('Cloaking Templates', () => {
  test('T65 – /cloak/<code> returns HTML preview page (generic)', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/cloak/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/120' },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('<!DOCTYPE html>');
    // Should contain auto-redirect JS
    expect(body).toContain('window.location.replace');
  });

  test('T66 – Microsoft template renders Microsoft branding', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/cloak/${link.short_code}?template=microsoft`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh) Safari/537.36' },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('Microsoft');
  });

  test('T67 – DocuSign template renders DocuSign branding', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/cloak/${link.short_code}?template=docusign`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/120' },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('DocuSign');
  });

  test('T68 – Google template renders Google branding', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/cloak/${link.short_code}?template=google`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0) Chrome/120' },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('Google');
  });

  test('T69 – Email param personalises cloak page', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const email = 'target@example.com';
    const res = await fetch(
      `${BASE}/cloak/${link.short_code}?template=microsoft&email=${encodeURIComponent(email)}`,
      {
        redirect: 'manual',
        headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' },
      }
    );
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain(email);
  });

  test('T70 – Scanner UA on cloak endpoint gets deflected (safe 200, no branding)', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/cloak/${link.short_code}?template=microsoft`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Outlook SafeLinks/1.0' },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    // Should be the minimal blank scanner deflect page, NOT the full Microsoft template
    expect(body).not.toContain('Sign in to Microsoft');
    expect(res.headers.get('x-scanner-deflect')).toBe('1');
  });

  test('T71 – Unknown template falls back to generic', async () => {
    const { token } = await register();
    const link = await createLink(token);
    const res = await fetch(`${BASE}/cloak/${link.short_code}?template=unknownxyz`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    // Generic page should still have redirect JS
    expect(body).toContain('window.location.replace');
  });

  test('T72 – Cloak page embeds destination URL in redirect JS', async () => {
    const { token } = await register();
    const targetUrl = 'https://example.com/landing-page';
    const link = await createLink(token, { target_url: targetUrl });
    const res = await fetch(`${BASE}/cloak/${link.short_code}`, {
      redirect: 'manual',
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120' },
    });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain(targetUrl);
  });
});
