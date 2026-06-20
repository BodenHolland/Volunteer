import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const log = (...a) => console.log("•", ...a);
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));

async function persona(id) {
  // Deterministic identity switch for the test (the UI switcher is verified separately).
  await ctx.addCookies([{ name: "cf_session", value: id, url: BASE }]);
}

// 1. password gate
await p.goto(`${BASE}/enter`, { waitUntil: "networkidle" });
await p.fill('input[name="password"]', "tended-pilot");
await p.click('button[type="submit"]');
await p.waitForURL((u) => !u.pathname.startsWith("/enter"));
log("1. entered");

// 2-4. onboarding wizard (prefilled as Marisol)
await p.goto(`${BASE}/start`, { waitUntil: "networkidle" });
await p.click('button:has-text("Continue")'); // basics -> location
await p.waitForURL(/step=location/);
await p.click('button:has-text("Continue")'); // location(snap) -> phone
await p.waitForURL(/step=phone/);
await p.fill('input[name="code"]', "123456");
await p.click('button:has-text("Verify")');
await p.waitForURL(/step=pii/);
await p.click('button:has-text("Continue")'); // pii -> benefitscal
await p.waitForURL(/step=benefitscal/);
await p.click('button:has-text("Skip")');
await p.waitForURL(/step=welcome/);
await p.screenshot({ path: "docs/screenshots/start-welcome-1440x900.png" });
await p.click('a:has-text("Go to your dashboard")');
await p.waitForURL(/\/app$/);
log("2-4. onboarding complete → dashboard");

// 5. dashboard certified baseline
const baseText = await p.locator("body").innerText();
const baseCert = (baseText.match(/(\d+) certified/) || [])[1];
log("5. dashboard certified =", baseCert);

// 6-7. commit tree census
await p.goto(`${BASE}/app/tasks/task_trees`, { waitUntil: "networkidle" });
await p.click('button:has-text("Commit to task")');
await p.waitForURL(/\/app\/projects\/sub_/);
const subId = p.url().split("/").pop();
log("7. committed →", subId);

// 8-9. hub: session + checklist
await p.click('button:has-text("Start session")');
await p.waitForTimeout(1200);
for (const t of ["Walk both sides", "Note a species", "Record trunk size", "Photograph at least"]) {
  await p.click(`button:has-text("${t}")`);
  await p.waitForTimeout(120);
}
await p.click('button:has-text("Stop session")');
await p.waitForTimeout(800);
log("8-9. session logged + checklist done");

// 10. submit
await p.click('a:has-text("Submit when ready")');
await p.waitForURL(/\/submit$/);
await p.setInputFiles('input[type="file"]', ["/tmp/tree1.jpg", "/tmp/tree2.jpg", "/tmp/tree3.jpg"]);
await p.waitForTimeout(700);
await p.fill('textarea[name="content"]', "Counted 11 street trees on the 1200 block of Alabama St.");
await p.click('button:has-text("Submit work")');
await p.waitForURL(/\/app\/submissions\//);
log("10. submitted");

// 11. verdict
let status = "ai_reviewing";
for (let i = 0; i < 12; i++) {
  const r = await ctx.request.get(`${BASE}/api/submissions/${subId}/status`);
  status = (await r.json()).status;
  if (status !== "ai_reviewing" && status !== "submitted") break;
  await p.waitForTimeout(1200);
}
log("11. verdict status =", status);

// 12-14. switch to Daniel (FUF reviewer) and approve
await persona("user_daniel");
await p.goto(`${BASE}/org/submissions/${subId}`, { waitUntil: "networkidle" });
await p.waitForSelector('button:has-text("Approve and certify")');
await p.fill('input[name="hours"]', "3");
await p.click('button:has-text("Approve and certify")');
await p.waitForURL((u) => u.pathname === "/org/submissions");
log("14. approved as reviewer");

// 15. back to Marisol, certified should increase
await persona("user_marisol");
await p.goto(`${BASE}/app`, { waitUntil: "networkidle" });
const afterText = await p.locator("body").innerText();
const afterCert = (afterText.match(/(\d+) certified/) || [])[1];
log("15. dashboard certified =", afterCert, baseCert ? `(was ${baseCert})` : "");

// 16. CF888
const pdf = await ctx.request.get(`${BASE}/api/cf888?month=2026-06`);
const buf = await pdf.body();
const isPdf = buf.slice(0, 5).toString() === "%PDF-";
log("16. CF888:", pdf.status(), pdf.headers()["content-type"], isPdf ? "valid PDF" : "NOT PDF");

console.log(errs.length ? "\nPAGE ERRORS:\n" + errs.join("\n") : "\nno page errors");
await b.close();
