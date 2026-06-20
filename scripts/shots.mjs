import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";

// name, path, persona (null = public, post-password only)
const PAGES = [
  ["enter", "/enter", "none"],
  ["landing", "/", null],
  ["how-it-works", "/how-it-works", null],
  ["about", "/about", null],
  ["for-organizations", "/for-organizations", null],
  ["contact", "/contact", null],
  ["org-signup", "/org/signup", null],
  ["org-public-profile", "/orgs/sf-civic-data-coalition", null],
  ["task-preview", "/tasks/task_trees/preview", null],
  ["start", "/start", null],
  ["app-dashboard", "/app", "user_marisol"],
  ["app-tasks", "/app/tasks", "user_marisol"],
  ["app-task-detail", "/app/tasks/task_trees", "user_marisol"],
  ["app-projects", "/app/projects", "user_marisol"],
  ["app-project-hub", "/app/projects/sub_m_progress", "user_marisol"],
  ["app-submissions", "/app/submissions", "user_marisol"],
  ["app-submission-detail", "/app/submissions/sub_m_pending", "user_marisol"],
  ["app-profile", "/app/profile", "user_marisol"],
  ["app-settings", "/app/settings", "user_marisol"],
  ["org-dashboard", "/org", "user_daniel"],
  ["org-queue", "/org/submissions", "user_daniel"],
  ["org-review", "/org/submissions/sub_a_pending", "user_daniel"],
  ["org-tasks", "/org/tasks", "user_priya"],
  ["org-task-new", "/org/tasks/new", "user_priya"],
  ["org-profile", "/org/profile", "user_priya"],
  ["org-team", "/org/team", "user_priya"],
  ["admin-overview", "/admin", "user_admin"],
  ["admin-users", "/admin/users", "user_admin"],
  ["admin-orgs", "/admin/orgs", "user_admin"],
  ["admin-submissions", "/admin/submissions", "user_admin"],
  ["admin-feedback", "/admin/feedback", "user_admin"],
  ["admin-reset", "/admin/reset", "user_admin"],
];

const VIEWPORTS = [
  { label: "1440x900", width: 1440, height: 900 },
  { label: "390x844", width: 390, height: 844 },
];

const only = process.argv[2]; // optional filter substring
const b = await chromium.launch();
let ok = 0;
const fails = [];

for (const vp of VIEWPORTS) {
  for (const [name, path, persona] of PAGES) {
    if (only && !name.includes(only)) continue;
    const cookies = [];
    if (persona !== "none") cookies.push({ name: "cf_demo_auth", value: "ok", url: BASE });
    if (persona && persona !== "none") cookies.push({ name: "cf_session", value: persona, url: BASE });
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2 });
    if (cookies.length) await ctx.addCookies(cookies);
    const p = await ctx.newPage();
    try {
      const resp = await p.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 20000 });
      await p.waitForTimeout(350);
      await p.screenshot({ path: `docs/screenshots/${name}-${vp.label}.png`, fullPage: true });
      const code = resp?.status() ?? 0;
      if (code >= 400) fails.push(`${name} ${vp.label} HTTP ${code}`);
      else ok++;
    } catch (e) {
      fails.push(`${name} ${vp.label}: ${e.message}`);
    }
    await ctx.close();
  }
}

console.log(`captured ${ok} screenshots`);
if (fails.length) console.log("FAILS:\n" + fails.join("\n"));
await b.close();
