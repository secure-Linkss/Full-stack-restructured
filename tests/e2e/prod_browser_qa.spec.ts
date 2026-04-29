/**
 * Production Browser QA — brain-link-tracker-v2.vercel.app
 * Navigates every page in Chrome, takes screenshots, verifies content renders.
 */
import { test, expect, Page } from '@playwright/test';

const PROD = 'https://brain-link-tracker-v2.vercel.app';
const SS = 'test-results/browser-qa';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SS}/${name}.png`, fullPage: true });
}

async function assertNotBlank(page: Page, label: string) {
  const text = await page.evaluate(() => document.body.innerText.trim());
  expect(text.length, `${label}: page appears blank`).toBeGreaterThan(50);
  expect(text, `${label}: stuck on loading`).not.toMatch(/^loading\.\.\.$/i);
}

/** Login helper — uses actual form selectors from LoginPage.jsx */
async function loginAsBrain(page: Page) {
  await page.goto(`${PROD}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  // username field has placeholder "Enter your email"
  await page.getByPlaceholder('Enter your email').fill('Brain');
  // password field has placeholder "••••••••"
  await page.getByPlaceholder('••••••••').fill('Mayflower1!!');
  // submit button text: "Sign In to Dashboard"
  await page.getByRole('button', { name: 'Sign In to Dashboard' }).click();
  // navigates to /dashboard on success
  await page.waitForURL(`${PROD}/dashboard`, { timeout: 20000 });
  await page.waitForTimeout(2000);
}

// ─────────────────────────────────────────
// 1. Public Marketing Pages
// ─────────────────────────────────────────
test.describe('Public Marketing Pages', () => {
  const pages: [string, RegExp | null][] = [
    ['/',          /brain/i],
    ['/features',  null],
    ['/pricing',   null],
    ['/about',     null],
    ['/contact',   null],
    ['/register',  /create your account/i],
    ['/login',     /welcome back/i],
    ['/privacy',   null],
    ['/terms',     null],
  ];

  for (const [route, textMatch] of pages) {
    test(`renders ${route}`, async ({ page }) => {
      await page.goto(`${PROD}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      const safeName = route === '/' ? 'home' : route.replace('/', '');
      await shot(page, `public_${safeName}`);
      await assertNotBlank(page, route);
      if (textMatch) {
        const body = await page.evaluate(() => document.body.innerText);
        expect(body, `${route} should contain expected text`).toMatch(textMatch);
      }
    });
  }
});

// ─────────────────────────────────────────
// 2. Auth Flow
// ─────────────────────────────────────────
test.describe('Auth Flow', () => {
  test('login works and lands on /dashboard', async ({ page }) => {
    await loginAsBrain(page);
    await shot(page, 'auth_dashboard_post_login');
    await assertNotBlank(page, '/dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});

// ─────────────────────────────────────────
// 3. Authenticated Dashboard Pages
// ─────────────────────────────────────────
test.describe('Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBrain(page);
  });

  test('Dashboard overview — metric cards present', async ({ page }) => {
    await shot(page, 'dash_overview');
    await assertNotBlank(page, '/dashboard');
    const body = await page.evaluate(() => document.body.innerText);
    // At least one of the known metric labels must be visible
    const hasMetrics = /total clicks|real visitors|bots blocked|links/i.test(body);
    expect(hasMetrics, 'Dashboard should show metric cards').toBe(true);
  });

  test('Tracking Links page — renders rows', async ({ page }) => {
    await page.goto(`${PROD}/tracking-links`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot(page, 'dash_tracking_links');
    await assertNotBlank(page, '/tracking-links');
  });

  test('Analytics page renders', async ({ page }) => {
    await page.goto(`${PROD}/analytics`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot(page, 'dash_analytics');
    await assertNotBlank(page, '/analytics');
  });

  test('Campaigns page renders', async ({ page }) => {
    await page.goto(`${PROD}/campaigns`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot(page, 'dash_campaigns');
    await assertNotBlank(page, '/campaigns');
  });

  test('Notifications page renders', async ({ page }) => {
    await page.goto(`${PROD}/notifications`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot(page, 'dash_notifications');
    await assertNotBlank(page, '/notifications');
  });

  test('Settings page renders — no "Failed to load" errors', async ({ page }) => {
    await page.goto(`${PROD}/settings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot(page, 'dash_settings');
    await assertNotBlank(page, '/settings');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load/i);
  });

  test('API Keys tab — no "Failed to load" error', async ({ page }) => {
    await page.goto(`${PROD}/settings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    // Try clicking API Access tab if present
    const apiTab = page.getByText(/api access|api key/i).first();
    const visible = await apiTab.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      await apiTab.click();
      await page.waitForTimeout(2000);
    }
    await shot(page, 'dash_api_keys');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load/i);
  });

  test('Profile page renders', async ({ page }) => {
    await page.goto(`${PROD}/profile`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot(page, 'dash_profile');
    await assertNotBlank(page, '/profile');
  });
});

// ─────────────────────────────────────────
// 4. Admin Panel
// ─────────────────────────────────────────
test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsBrain(page);
  });

  test('Admin panel renders', async ({ page }) => {
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot(page, 'admin_panel');
    await assertNotBlank(page, '/admin');
  });
});

// ─────────────────────────────────────────
// 5. Quantum Redirect
// ─────────────────────────────────────────
test.describe('Quantum Redirect', () => {
  test('short link chain ends on /bridge with quantum params', async ({ page }) => {
    const resp = await page.request.post(`${PROD}/api/auth/login`, {
      data: { username: 'Brain', password: 'Mayflower1!!' },
    });
    const { token } = await resp.json();
    const linksResp = await page.request.get(`${PROD}/api/links`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await linksResp.json();
    const linksList = Array.isArray(data) ? data : (data.links || []);
    const shortCode = linksList[0]?.short_code || linksList[0]?.code;
    if (!shortCode) {
      test.skip(true, 'Brain account has no tracking links — skipping redirect chain test');
      return;
    }

    await page.goto(`${PROD}/t/${shortCode}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    await shot(page, 'quantum_bridge');

    const url = page.url();
    const decodedUrl = decodeURIComponent(url);
    expect(url, 'Should land on /bridge').toContain('/bridge');
    expect(decodedUrl, 'Should have quantum_verified=true').toContain('quantum_verified=true');
    // Bridge page is intentionally minimal — just "Redirecting..." before JS fires
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    expect(bodyText.length, 'Bridge page should have content').toBeGreaterThan(0);
  });
});
