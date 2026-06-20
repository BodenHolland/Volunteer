import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errs = [];
p.on("pageerror", (e) => errs.push(String(e)));

// login + Marisol
await p.goto(`${BASE}/enter`, { waitUntil: "networkidle" });
await p.fill('input[name="password"]', "tended-pilot");
await p.click('button[type="submit"]');
await p.waitForURL((u) => !u.pathname.startsWith("/enter"));
await p.goto(`${BASE}/start`, { waitUntil: "networkidle" });
await p.click('[data-persona="user_marisol"]');
await p.waitForTimeout(800);

// commit to tree census
await p.goto(`${BASE}/app/tasks/task_trees`, { waitUntil: "networkidle" });
await p.click('button:has-text("Commit to task")');
await p.waitForURL(/\/app\/projects\/sub_/);
const projUrl = p.url();
const subId = projUrl.split("/").pop();
console.log("committed →", subId);

// start session
await p.click('button:has-text("Start session")');
await p.waitForTimeout(1500);
// check the 4 required items
for (const t of ["Walk both sides", "Note a species", "Record trunk size", "Photograph at least"]) {
  await p.click(`button:has-text("${t}")`);
  await p.waitForTimeout(150);
}
// stop session
await p.click('button:has-text("Stop session")');
await p.waitForTimeout(1000);
await p.screenshot({ path: "docs/screenshots/app-project-hub-1440x900.png", fullPage: true });

// submit
await p.click('a:has-text("Submit when ready")');
await p.waitForURL(/\/submit$/);
await p.setInputFiles('input[type="file"]', ["/tmp/tree1.jpg", "/tmp/tree2.jpg", "/tmp/tree3.jpg"]);
await p.waitForTimeout(800);
await p.fill('textarea[name="content"]', "Counted 11 street trees on the 1200 block of Alabama St — mostly London plane, two ginkgos. Three need pruning.");
await p.click('button:has-text("Submit work")');
await p.waitForURL(/\/app\/submissions\//, { timeout: 20000 });
console.log("submitted → submissions page");

// wait for verdict (status leaves reviewing)
let status = "ai_reviewing";
for (let i = 0; i < 15; i++) {
  const r = await ctx.request.get(`${BASE}/api/submissions/${subId}/status`);
  const d = await r.json();
  status = d.status;
  if (status !== "ai_reviewing" && status !== "submitted") { console.log("verdict status:", status, "| verdict:", d.verdict?.verdict); break; }
  await p.waitForTimeout(1500);
}
await p.reload({ waitUntil: "networkidle" });
await p.waitForTimeout(500);
await p.screenshot({ path: "docs/screenshots/app-submission-detail-1440x900.png", fullPage: true });

console.log("page errors:", errs.length ? errs.join("\n") : "none");
await b.close();
