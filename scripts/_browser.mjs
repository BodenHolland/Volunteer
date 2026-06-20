import { chromium } from "playwright";

export const BASE = process.env.BASE_URL || "http://localhost:3000";
export const PASSWORD = process.env.SITE_PASSWORD || "tended-pilot";

/** Launch a browser + a context already past the password gate, as `persona`. */
export async function loggedInContext({ persona, viewport } = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: viewport || { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  // password gate
  await page.goto(`${BASE}/enter`, { waitUntil: "networkidle" });
  await page.fill('input[name="password"]', PASSWORD);
  await Promise.all([page.waitForLoadState("networkidle"), page.click('button[type="submit"]')]);
  // choose identity if requested
  if (persona) {
    await page.goto(`${BASE}/start?switch=1`, { waitUntil: "networkidle" });
    const btn = page.locator(`[data-persona="${persona}"]`);
    if (await btn.count()) {
      await Promise.all([page.waitForLoadState("networkidle"), btn.first().click()]);
    }
  }
  return { browser, context, page };
}
