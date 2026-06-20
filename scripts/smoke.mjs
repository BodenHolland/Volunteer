import { chromium } from "playwright";
const BASE = "http://localhost:3000";

async function login(page, persona) {
  await page.goto(`${BASE}/enter`, { waitUntil: "networkidle" });
  await page.fill('input[name="password"]', "tended-pilot");
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/enter"), { timeout: 15000 });
  await page.goto(`${BASE}/start`, { waitUntil: "networkidle" });
  await page.click(`[data-persona="${persona}"]`);
  await page.waitForTimeout(1200);
}

const paths = process.argv.slice(2);
const persona = process.env.PERSONA || "user_marisol";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(`[pageerror] ${e}`));
page.on("console", (m) => { if (m.type() === "error") errs.push(`[console] ${m.text()}`); });

await login(page, persona);
for (const p of paths) {
  const resp = await page.goto(`${BASE}${p}`, { waitUntil: "networkidle" }).catch((e) => ({ status: () => "ERR " + e.message }));
  console.log(`${p} → ${resp.status ? resp.status() : "?"}  url=${page.url()}`);
}
await page.waitForTimeout(300);
console.log(errs.length ? "ERRORS:\n" + errs.join("\n") : "no page/console errors");
await b.close();
