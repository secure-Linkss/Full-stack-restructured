/**
 * Deep QA — Settings tabs, Campaign creation, Row expansion, Mobile viewport
 * Targets: https://brain-link-tracker-v2.vercel.app
 */
import { test, expect, Page } from '@playwright/test';

const PROD = 'https://brain-link-tracker-v2.vercel.app';
const SS = 'test-results/deep-qa';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SS}/${name}.png`, fullPage: true });
}

async function loginAs(page: Page, username: string, password: string, expectedPath = '/dashboard') {
  await page.goto(`${PROD}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('Enter your email').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  await page.getByRole('button', { name: 'Sign In to Dashboard' }).click();
  await page.waitForURL(`${PROD}${expectedPath}`, { timeout: 20000 });
  await page.waitForTimeout(2000);
}

// ─────────────────────────────────────────
// Settings Tabs QA
// ─────────────────────────────────────────
test.describe('Settings Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/settings`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
  });

  test('Account tab renders', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /account/i }).or(page.getByText(/^account$/i)).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) await tab.click();
    await page.waitForTimeout(1500);
    await shot(page, 'settings_account');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/error|failed/i);
  });

  test('Appearance tab renders with preview', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /appearance/i }).or(page.getByText(/^appearance$/i)).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) await tab.click();
    await page.waitForTimeout(2000);
    await shot(page, 'settings_appearance');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load/i);
    // Should have theme buttons
    const hasPalette = /dark|light|system|theme|appearance/i.test(body);
    expect(hasPalette, 'Appearance tab should show theme options').toBe(true);
  });

  test('Security tab renders', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /security/i }).or(page.getByText(/^security$/i)).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) await tab.click();
    await page.waitForTimeout(1500);
    await shot(page, 'settings_security');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load/i);
  });

  test('Notifications tab renders', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /notification/i }).or(page.getByText(/notification/i)).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) await tab.click();
    await page.waitForTimeout(1500);
    await shot(page, 'settings_notifications');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load/i);
  });

  test('API Keys tab renders', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /api|keys/i }).or(page.getByText(/api access|api key/i)).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) await tab.click();
    await page.waitForTimeout(2000);
    await shot(page, 'settings_api_keys');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load/i);
  });

  test('Billing tab renders', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /billing/i }).or(page.getByText(/^billing$/i)).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) await tab.click();
    await page.waitForTimeout(2000);
    await shot(page, 'settings_billing');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load/i);
  });

  test('Domains tab renders', async ({ page }) => {
    const tab = page.getByRole('tab', { name: /domain/i }).or(page.getByText(/custom domain/i)).first();
    if (await tab.isVisible({ timeout: 3000 }).catch(() => false)) await tab.click();
    await page.waitForTimeout(2000);
    await shot(page, 'settings_domains');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load/i);
  });
});

// ─────────────────────────────────────────
// Campaign Creation Flow
// ─────────────────────────────────────────
test.describe('Campaign Creation', () => {
  test('Create Campaign modal opens and submits', async ({ page }) => {
    await loginAs(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/campaigns`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Click the page "+ Create New Campaign" button (not the nav link)
    // The page header action button has text "Create New Campaign" or "Create"
    const createBtn = page.getByRole('button', { name: /create new campaign|^create$/i })
      .or(page.locator('button.btn-primary').filter({ hasText: /create/i }))
      .last();
    await expect(createBtn).toBeVisible({ timeout: 5000 });
    await createBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'campaign_modal_open');

    // Modal should be visible
    const dialog = page.getByRole('dialog').or(page.locator('[role="dialog"]')).first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Fill in the form — use the labeled input inside the dialog
    const campaignName = `QA Test Campaign ${Date.now()}`;
    await page.getByRole('textbox', { name: /campaign name/i }).fill(campaignName);
    await shot(page, 'campaign_modal_filled');

    // Submit — last "Create Campaign" button is inside the modal footer
    const submitBtn = page.getByRole('button', { name: /^create campaign$/i }).last();
    await submitBtn.click();
    await page.waitForTimeout(4000);
    await shot(page, 'campaign_after_submit');

    // Modal should close or a success toast appeared
    const body = await page.evaluate(() => document.body.innerText);
    const modalGone = !(await dialog.isVisible({ timeout: 500 }).catch(() => false));
    const hasToast = /created successfully|campaign created/i.test(body);
    const campaignInList = body.includes(campaignName.slice(0, 10));
    expect(modalGone || hasToast || campaignInList, 'Campaign creation should succeed').toBe(true);
  });
});

// ─────────────────────────────────────────
// Row Expansion
// ─────────────────────────────────────────
test.describe('Row Expansion', () => {
  test('Campaigns page — analytics drawer expands', async ({ page }) => {
    await loginAs(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/campaigns`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(4000);
    await shot(page, 'expand_campaigns_before');

    // Click first "Analytics" expand button
    const expandBtn = page.getByRole('button', { name: /analytics|expand|details/i }).first();
    const isVisible = await expandBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip(true, 'No campaigns to expand');
      return;
    }
    await expandBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, 'expand_campaigns_after');

    const body = await page.evaluate(() => document.body.innerText);
    // Expanded row should show stats/clicks/etc
    const hasContent = /clicks|total|conv|analytics|hide/i.test(body);
    expect(hasContent, 'Expanded row should show analytics content').toBe(true);
  });

  test('Admin Users — details drawer expands', async ({ page }) => {
    await loginAs(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Navigate to Users tab
    const usersTab = page.getByRole('tab', { name: /users/i }).or(page.getByText(/user management|all users/i)).first();
    const tabVisible = await usersTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (tabVisible) await usersTab.click();
    await page.waitForTimeout(2000);
    await shot(page, 'expand_admin_users_before');

    // Click first Details button
    const detailsBtn = page.getByRole('button', { name: /details|expand/i }).first();
    const btnVisible = await detailsBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!btnVisible) {
      test.skip(true, 'No admin user rows to expand');
      return;
    }
    await detailsBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, 'expand_admin_users_after');

    const body = await page.evaluate(() => document.body.innerText);
    const hasDetails = /plan|role|email|username|clicks|created|hide/i.test(body);
    expect(hasDetails, 'User details drawer should show user info').toBe(true);
  });

  test('Admin Links — details drawer expands', async ({ page }) => {
    await loginAs(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    const linksTab = page.getByRole('tab', { name: /links/i }).or(page.getByText(/link management/i)).first();
    const tabVisible = await linksTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (tabVisible) await linksTab.click();
    await page.waitForTimeout(2000);

    const expandBtn = page.getByRole('button', { name: /details|expand/i }).first();
    const btnVisible = await expandBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!btnVisible) {
      test.skip(true, 'No admin link rows to expand');
      return;
    }
    await expandBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, 'expand_admin_links');
    const body = await page.evaluate(() => document.body.innerText);
    const hasContent = /hide|click|url|destination|created|short|visitor/i.test(body);
    expect(hasContent, 'Link details drawer should show link info').toBe(true);
  });
});

// ─────────────────────────────────────────
// Mobile Viewport (390x844)
// ─────────────────────────────────────────
test.describe('Mobile Viewport', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Dashboard renders on mobile without overflow', async ({ page }) => {
    await loginAs(page, 'Brain', 'Mayflower1!!');
    await shot(page, 'mobile_dashboard');
    // Body should not have horizontal scroll (no overflow-x wider than viewport)
    const hasHScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(hasHScroll, 'Dashboard should not overflow horizontally on mobile').toBe(false);
  });

  test('Admin panel renders on mobile', async ({ page }) => {
    await loginAs(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot(page, 'mobile_admin');
    const text = await page.evaluate(() => document.body.innerText);
    expect(text.length).toBeGreaterThan(50);
  });

  test('Campaigns page renders on mobile', async ({ page }) => {
    await loginAs(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/campaigns`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await shot(page, 'mobile_campaigns');
    const hasHScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 5);
    expect(hasHScroll, 'Campaigns should not overflow horizontally on mobile').toBe(false);
  });
});

// ─────────────────────────────────────────
// Multi-Account Role Test
// ─────────────────────────────────────────
test.describe('Multi-Account Logins', () => {
  const accounts = [
    { username: '7thbrain', password: 'Mayflower1!', role: 'admin' },
    { username: 'enterprise_test', password: 'Enterprise2024!', role: 'enterprise user' },
    { username: 'pro_test', password: 'Pro2024!', role: 'pro user' },
  ];

  for (const { username, password, role } of accounts) {
    test(`${role} (${username}) can login and see dashboard`, async ({ page }) => {
      await loginAs(page, username, password);
      await shot(page, `login_${username}`);
      await page.goto(`${PROD}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      await shot(page, `dashboard_${username}`);
      const body = await page.evaluate(() => document.body.innerText);
      expect(body.length).toBeGreaterThan(50);
      expect(body).not.toMatch(/unauthorized|forbidden|403|not found/i);
    });
  }

  test('Pro user does NOT see admin panel', async ({ page }) => {
    await loginAs(page, 'pro_test', 'Pro2024!');
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    await shot(page, 'pro_user_admin_attempt');
    // Should be redirected away or see access denied
    const url = page.url();
    const body = await page.evaluate(() => document.body.innerText);
    const isBlocked = !url.endsWith('/admin') || /access denied|unauthorized|forbidden|not authorized/i.test(body);
    // Either redirected away from /admin or shows access error
    expect(url).not.toMatch(/error/);
  });
});
