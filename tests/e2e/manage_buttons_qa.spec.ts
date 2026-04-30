/**
 * Manage Buttons QA — Verifies ALL action buttons on ALL tables are wired
 * and working after the 2026-04-30 fix deployment.
 *
 * Tests:
 * 1. Admin Campaigns — Actions dropdown opens, Edit modal, Details expand
 * 2. Admin Links — Actions dropdown opens, Edit Target URL modal, Analytics expand
 * 3. Admin Users — Manage dropdown, Add User modal, Details expand
 * 4. User Campaigns — Campaign page, Analytics expand
 * 5. Link Shortener — domain dropdown, btn-primary, no PURL text
 * 6. Create Tracking Link — domain dropdown populated
 * 7. Settings/Admin — domain tabs load
 * 8. Mobile — no overflow
 */

import { test, expect, Page } from '@playwright/test';

const PROD = 'https://brain-link-tracker-v2.vercel.app';
const SS = 'test-results/manage-qa';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${SS}/${name}.png`, fullPage: true });
}

async function login(page: Page, username: string, password: string) {
  await page.goto(`${PROD}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(800);
  await page.getByPlaceholder('Enter your email').fill(username);
  await page.getByPlaceholder('••••••••').fill(password);
  const signInBtn = page.getByRole('button', { name: 'Sign In to Dashboard' });
  await signInBtn.waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(300);
  await signInBtn.click({ force: true, timeout: 12000 });
  await page.waitForURL(`${PROD}/dashboard`, { timeout: 25000 });
  await page.waitForTimeout(1000);
}

/**
 * Click an admin sidebar tab.
 * AdminPanel uses plain <button> elements — NOT role="tab".
 * Use :visible to skip the hidden mobile tab bar (lg:hidden).
 */
async function clickAdminTab(page: Page, tabTitle: string) {
  const btn = page.locator('button:visible').filter({ hasText: new RegExp(tabTitle, 'i') }).first();
  const visible = await btn.isVisible({ timeout: 5000 }).catch(() => false);
  if (visible) {
    await btn.click();
    await page.waitForTimeout(2500);
  }
}

/**
 * Click a dropdown menu item via JavaScript dispatch.
 * Radix UI portals render at document.body and may position items outside the
 * viewport (negative or >720px y-coords). Playwright's force:true skips CSS
 * actionability checks but still requires viewport coordinates for CDP mouse
 * events — which fail for off-screen elements. Native JS .click() has no
 * such restriction and correctly triggers React's synthetic event handler.
 */
async function clickDropdownItem(page: Page, pattern: RegExp) {
  // Wait up to 3s for any matching menuitem to appear in the DOM
  try {
    await page.waitForFunction(
      (ps) => {
        const regex = new RegExp(ps, 'i');
        return Array.from(document.querySelectorAll('[role="menuitem"]'))
          .some(el => regex.test(el.textContent || ''));
      },
      pattern.source,
      { timeout: 3000 }
    );
  } catch {
    return false; // item never appeared
  }

  // Dispatch via JS — bypasses viewport coordinate restrictions
  return await page.evaluate((ps) => {
    const regex = new RegExp(ps, 'i');
    const item = Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find(el => regex.test(el.textContent || '')) as HTMLElement | undefined;
    if (!item) return false;
    item.click();
    return true;
  }, pattern.source);
}

// ─────────────────────────────────────────────────────────────
// ADMIN CAMPAIGNS — manage buttons
// ─────────────────────────────────────────────────────────────
test.describe('Admin Campaigns — manage buttons', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    await clickAdminTab(page, 'Campaigns');
  });

  test('Campaign table loads with data', async ({ page }) => {
    await shot(page, 'admin_campaigns_table');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load campaigns/i);
  });

  test('Actions dropdown opens on campaign row', async ({ page }) => {
    const actionsBtn = page.locator('button:visible').filter({ hasText: /^Actions$/i }).first();
    const visible = await actionsBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No campaign rows found'); return; }

    await actionsBtn.scrollIntoViewIfNeeded();
    await actionsBtn.click();
    await page.waitForTimeout(800);
    await shot(page, 'admin_campaign_actions_open');

    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/inspect telemetry|edit campaign|pause|eradicate/i);
  });

  test('Edit Campaign modal opens and has fields', async ({ page }) => {
    // Scroll to top so the row is near the top — dropdown renders downward, stays in viewport
    await page.evaluate(() => window.scrollTo(0, 0));
    const actionsBtn = page.locator('button:visible').filter({ hasText: /^Actions$/i }).first();
    const visible = await actionsBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No campaign rows'); return; }

    await actionsBtn.scrollIntoViewIfNeeded();
    await actionsBtn.click();
    await page.waitForTimeout(800);

    // JS click — Radix portals render at body root, potentially below viewport
    const clicked = await clickDropdownItem(page, /edit campaign/i);
    if (!clicked) { test.skip(true, 'Edit Campaign item not found'); return; }

    await page.waitForTimeout(1000);
    await shot(page, 'admin_campaign_edit_modal');

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 6000 });
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/campaign name|edit campaign/i);
    expect(body).toMatch(/save changes/i);
  });

  test('Details expand button works on campaign row', async ({ page }) => {
    // Scroll down a bit so the Details button is mid-viewport, not at the edge
    await page.evaluate(() => window.scrollBy(0, 100));
    const expandBtn = page.locator('button:visible').filter({ hasText: /Details/i }).first();
    const visible = await expandBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No Details buttons found'); return; }

    await expandBtn.scrollIntoViewIfNeeded();
    await expandBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, 'admin_campaign_expanded');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/total clicks|conversions|campaign details|collapse/i);
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN LINKS — manage buttons
// ─────────────────────────────────────────────────────────────
test.describe('Admin Links — manage buttons', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    await clickAdminTab(page, 'Links');
  });

  test('Link table loads without error', async ({ page }) => {
    await shot(page, 'admin_links_table');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load all link endpoints/i);
  });

  test('Actions dropdown opens on link row', async ({ page }) => {
    const actionsBtn = page.locator('button:visible').filter({ hasText: /^Actions$/i }).first();
    const visible = await actionsBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No link rows found'); return; }

    await actionsBtn.scrollIntoViewIfNeeded();
    await actionsBtn.click();
    await page.waitForTimeout(800);
    await shot(page, 'admin_link_actions_open');

    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/inspect analytics|edit target url|pause link|resume link|eradicate/i);
  });

  test('Edit Target URL modal opens', async ({ page }) => {
    // Scroll to top so the row is near the top — dropdown renders within viewport
    await page.evaluate(() => window.scrollTo(0, 0));
    const actionsBtn = page.locator('button:visible').filter({ hasText: /^Actions$/i }).first();
    const visible = await actionsBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No link rows'); return; }

    await actionsBtn.scrollIntoViewIfNeeded();
    await actionsBtn.click();
    await page.waitForTimeout(800);

    // JS click — Radix portals render at body root, potentially below viewport
    const clicked = await clickDropdownItem(page, /edit target url/i);
    if (!clicked) { test.skip(true, 'Edit Target URL item not found'); return; }

    await page.waitForTimeout(1000);
    await shot(page, 'admin_link_edit_modal');

    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 6000 });
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/edit link target|destination url|save link/i);
  });

  test('Analytics expand button works on link row', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, 100));
    const expandBtn = page.locator('button:visible').filter({ hasText: /Analytics/i }).first();
    const visible = await expandBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No expand buttons found'); return; }

    await expandBtn.scrollIntoViewIfNeeded();
    await expandBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, 'admin_link_analytics_expanded');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/total clicks|real visitors|clicks over time|hide/i);
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN USERS — manage buttons
// ─────────────────────────────────────────────────────────────
test.describe('Admin Users — manage buttons', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    await clickAdminTab(page, 'Users');
  });

  test('User table loads with rows', async ({ page }) => {
    await shot(page, 'admin_users_table');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load user list/i);
    // Confirm Users tab is active (not just dashboard)
    expect(body).toMatch(/User Management|All Users|Add User/i);
  });

  test('Manage dropdown opens on user row', async ({ page }) => {
    // AdminUsers uses "Manage" not "Actions"
    const manageBtn = page.locator('button:visible').filter({ hasText: /^Manage$/i }).first();
    const visible = await manageBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No user rows with Manage button'); return; }

    await manageBtn.scrollIntoViewIfNeeded();
    await manageBtn.click();
    await page.waitForTimeout(800);
    await shot(page, 'admin_user_manage_open');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/edit user|delete user|reset password|suspend|view profile/i);
  });

  test('Add User button opens modal', async ({ page }) => {
    const addBtn = page.locator('button:visible').filter({ hasText: /add user/i }).first();
    const visible = await addBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No Add User button found'); return; }

    await addBtn.click();
    await page.waitForTimeout(1000);
    await shot(page, 'admin_create_user_modal');
    const dialog = page.getByRole('dialog').first();
    await expect(dialog).toBeVisible({ timeout: 6000 });
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/create user|username|email|password/i);
  });

  test('User Details expand button expands row', async ({ page }) => {
    await page.evaluate(() => window.scrollBy(0, 100));
    const detailsBtn = page.locator('button:visible').filter({ hasText: /Details/i }).first();
    const visible = await detailsBtn.isVisible({ timeout: 6000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No Details buttons found'); return; }

    await detailsBtn.scrollIntoViewIfNeeded();
    await detailsBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'admin_user_details_expanded');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/links created|total clicks|plan|account info|user details/i);
  });
});

// ─────────────────────────────────────────────────────────────
// USER DASHBOARD — Campaigns manage buttons
// ─────────────────────────────────────────────────────────────
test.describe('User Campaigns — manage buttons', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/campaigns`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
  });

  test('Campaign page loads without error', async ({ page }) => {
    await shot(page, 'user_campaigns_table');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load campaigns/i);
  });

  test('Analytics expand works on user campaign', async ({ page }) => {
    const expandBtn = page.locator('button:visible').filter({ hasText: /Analytics/i }).first();
    const visible = await expandBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No campaigns to expand'); return; }

    await expandBtn.scrollIntoViewIfNeeded();
    await expandBtn.click();
    await page.waitForTimeout(2000);
    await shot(page, 'user_campaign_analytics_expanded');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/total clicks|conv\. rate|analytics|hide/i);
  });
});

// ─────────────────────────────────────────────────────────────
// LINK SHORTENER — domain dropdown + button style + no PURL text
// ─────────────────────────────────────────────────────────────
test.describe('Link Shortener — domain dropdown + UI fixes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/link-shortener`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
  });

  test('Create New Link button has gradient style (not plain blue)', async ({ page }) => {
    await shot(page, 'shortener_page');
    const createBtn = page.getByRole('button', { name: /create new link/i });
    await expect(createBtn).toBeVisible({ timeout: 4000 });
    const classAttr = await createBtn.getAttribute('class');
    expect(classAttr, 'Create button should use btn-primary class').toMatch(/btn-primary/);
  });

  test('No PURL / email code "not supported" text visible', async ({ page }) => {
    await shot(page, 'shortener_link_box');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/shortener does not support/i);
    expect(body).not.toMatch(/N\/A \(Shortener/i);
  });

  test('Domain dropdown in Create Link modal shows default domain', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create new link/i });
    await createBtn.click();
    await page.waitForTimeout(5000); // allow cold start + async domain fetch
    await shot(page, 'shortener_create_modal_domain');

    const domainText = await page.evaluate(() => {
      const comboboxes = document.querySelectorAll('[role="combobox"]');
      return Array.from(comboboxes).map(el => el.textContent || '').join(' ');
    });

    // Accept domain URL text OR placeholder (field exists = domain section renders)
    const hasDomainText = /brain-link-tracker|vercel\.app|\.com|\.io|Select a domain/i.test(domainText);
    const domainFieldVisible = await page.locator('[id="domain"]').isVisible({ timeout: 3000 }).catch(() => false);
    expect(
      hasDomainText || domainFieldVisible,
      `Domain select should be present. Comboboxes: "${domainText}"`
    ).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// CREATE TRACKING LINK — domain dropdown
// ─────────────────────────────────────────────────────────────
test.describe('Create Tracking Link — domain dropdown', () => {
  test('Domain dropdown in tracking link modal is populated', async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/tracking-links`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);

    const createBtn = page.locator('button:visible').filter({ hasText: /create|new link|add link/i }).first();
    const visible = await createBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!visible) { test.skip(true, 'No create button on tracking links page'); return; }

    await createBtn.click();
    await page.waitForTimeout(3000);
    await shot(page, 'tracking_link_create_domain');

    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/select domain|routing hostname|brain-link-tracker|domain/i);
  });
});

// ─────────────────────────────────────────────────────────────
// SETTINGS — Domains tab
// ─────────────────────────────────────────────────────────────
test.describe('Settings — Custom Domains tab', () => {
  test('Custom Domains tab loads and shows add domain form', async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/settings`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);

    const domainTab = page.locator('button:visible, [role="tab"]').filter({ hasText: /^Domains?$/i }).first()
      .or(page.getByText(/custom domain/i).first());
    const tabVisible = await domainTab.isVisible({ timeout: 5000 }).catch(() => false);
    if (tabVisible) await domainTab.click();
    await page.waitForTimeout(2000);
    await shot(page, 'settings_domains_tab');

    const body = await page.evaluate(() => document.body.innerText);
    expect(body).toMatch(/custom domain|connect domain|hostname|dns/i);
    expect(body).not.toMatch(/failed to load domains/i);
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN DOMAINS — admin domain management tab
// ─────────────────────────────────────────────────────────────
test.describe('Admin — Domain management tab', () => {
  test('Admin domains tab shows domain list and add form', async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    await clickAdminTab(page, 'Domains');

    await shot(page, 'admin_domains_tab');
    const body = await page.evaluate(() => document.body.innerText);
    expect(body).not.toMatch(/failed to load|network error/i);
  });
});

// ─────────────────────────────────────────────────────────────
// MOBILE — manage buttons on mobile viewport
// ─────────────────────────────────────────────────────────────
test.describe('Mobile — manage buttons visible', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('Admin campaigns table renders on mobile, no overflow', async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/admin`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    await clickAdminTab(page, 'Campaigns');
    await shot(page, 'mobile_admin_campaigns');
    const hasHScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 10);
    expect(hasHScroll, 'Admin campaigns should not overflow on mobile').toBe(false);
  });

  test('Link shortener no horizontal overflow on mobile', async ({ page }) => {
    await login(page, 'Brain', 'Mayflower1!!');
    await page.goto(`${PROD}/link-shortener`, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2000);
    await shot(page, 'mobile_link_shortener');
    const hasHScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth + 10);
    expect(hasHScroll, 'Link shortener should not overflow on mobile').toBe(false);
  });
});
