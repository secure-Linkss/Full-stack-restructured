import { test, expect } from '@playwright/test';

const PROD = 'https://brain-link-tracker-v2.vercel.app';

async function loginAsBrain(page: any) {
  await page.goto(`${PROD}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.getByPlaceholder('Enter your email').fill('Brain');
  await page.getByPlaceholder('••••••••').fill('Mayflower1!!');
  await page.getByRole('button', { name: 'Sign In to Dashboard' }).click();
  await page.waitForURL(`${PROD}/dashboard`, { timeout: 20000 });
  await page.waitForTimeout(2000);
}

test('debug tracking links page', async ({ page }) => {
  const errors: string[] = [];
  const networkFails: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('requestfailed', req => {
    networkFails.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText}`);
  });
  page.on('response', resp => {
    if (!resp.ok() && resp.url().includes('/api/')) {
      networkFails.push(`HTTP ${resp.status()} ${resp.url()}`);
    }
  });

  await loginAsBrain(page);
  await page.goto(`${PROD}/tracking-links`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  await page.screenshot({ path: 'test-results/browser-qa/tracking_links_debug.png', fullPage: true });

  const bodyText = await page.evaluate(() => document.body.innerText.trim());
  console.log('Body length:', bodyText.length);
  console.log('Body preview:', bodyText.substring(0, 300));
  console.log('Console errors:', JSON.stringify(errors));
  console.log('Network fails:', JSON.stringify(networkFails));

  expect(errors.length, `Console errors: ${JSON.stringify(errors)}`).toBe(0);
  expect(bodyText.length).toBeGreaterThan(50);
});

test('debug dashboard overview (admin sees own data)', async ({ page }) => {
  const errors: string[] = [];
  const apiResponses: any[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('response', async resp => {
    if (resp.url().includes('/api/analytics/dashboard')) {
      try {
        const body = await resp.json();
        apiResponses.push({ url: resp.url(), status: resp.status(), body });
      } catch {}
    }
  });

  await loginAsBrain(page);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/browser-qa/dashboard_overview_debug.png', fullPage: true });

  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('Dashboard body preview:', bodyText.substring(0, 500));
  console.log('API responses:', JSON.stringify(apiResponses, null, 2));
  console.log('Console errors:', JSON.stringify(errors));

  // Should not show all zeros if user has links
  const hasData = /[1-9]\d*/.test(bodyText);
  console.log('Has non-zero numbers:', hasData);
});

test('period selector 24h works', async ({ page }) => {
  const networkFails: string[] = [];
  page.on('response', resp => {
    if (!resp.ok() && resp.url().includes('/api/')) {
      networkFails.push(`HTTP ${resp.status()} ${resp.url()}`);
    }
  });

  await loginAsBrain(page);

  // Click 24h period selector
  const period24h = page.getByText('24h').first();
  if (await period24h.isVisible({ timeout: 3000 }).catch(() => false)) {
    await period24h.click();
    await page.waitForTimeout(2000);
  }

  await page.screenshot({ path: 'test-results/browser-qa/period_24h.png', fullPage: true });
  console.log('Network fails after 24h click:', JSON.stringify(networkFails));
  expect(networkFails.filter(f => f.includes('500')).length).toBe(0);
});
