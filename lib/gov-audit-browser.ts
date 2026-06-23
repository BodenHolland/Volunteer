/**
 * Government Website Audit — server-side headless auto-check (PRD §6).
 *
 * Runs against an anchor URL on submit, server-side, to produce ground-truth
 * data that corroborates the volunteer's self-reported audit. Output feeds the
 * gov_audit_auto_checks public-cluster row (see migration 0013); the WRITE is
 * done by the server action, this module only PRODUCES the data.
 *
 * Three execution modes, degrading gracefully:
 *   - "browser_rendering": Cloudflare Browser Rendering (env.BROWSER) + axe-core.
 *     Full fidelity — real page load, page title, and automated a11y violations.
 *   - "fetch_only": plain fetch() when the BROWSER binding is absent (local dev /
 *     opennextjs) or puppeteer throws. HTTP status + <title>, no axe.
 *   - "skipped": reserved for callers; never produced here (an empty/invalid URL
 *     still resolves a fetch_only result with load_ok:false).
 *
 * INVARIANT: runAutoCheck NEVER throws. It runs on the submit path and must not
 * break a submission. Every code path resolves an AutoCheckResult.
 */

import { stripUrl } from "./gov-audit";
import { getEnv } from "./cf";

/**
 * axe-core is injected into the remote page from a pinned CDN URL rather than via
 * the bundled `axe.source` string: under the Workers/opennextjs bundler, the
 * default `import axe from "axe-core"` object's `.source` resolves to the CJS
 * module wrapper (references `exports`), which throws "exports is not defined"
 * when eval'd in a bare page context. The remote browser has internet access, so
 * loading the canonical min.js by URL is both correct and simplest. Pinned to the
 * version in package.json to keep results reproducible.
 */
const AXE_CDN_URL = "https://cdn.jsdelivr.net/npm/axe-core@4.12.1/axe.min.js";

export interface AutoCheckResult {
  url: string; // stripped (origin+path, no query)
  https_ok: boolean;
  http_status: number | null;
  load_ok: boolean;
  axe_violations: number | null;
  axe_summary: { id: string; impact: string | null; count: number }[] | null;
  page_title: string | null;
  check_mode: "browser_rendering" | "fetch_only" | "skipped";
}

/** Shape of a single axe-core violation we care about (subset of axe.Result). */
interface AxeViolation {
  id: string;
  impact?: string | null;
  nodes?: unknown[];
}
interface AxeRunResult {
  violations?: AxeViolation[];
}

/** Page-load timeout for headless navigation. */
const NAV_TIMEOUT_MS = 20_000;

/**
 * Run the server-side auto-check for one anchor URL.
 *
 * @param rawUrl the anchor URL (may carry a query string — stripped first).
 * @returns always resolves; never rejects.
 */
export async function runAutoCheck(rawUrl: string): Promise<AutoCheckResult> {
  const url = stripUrl(rawUrl);
  const https_ok = url.startsWith("https://");

  // No usable URL — nothing to fetch. Resolve a fetch_only miss.
  if (!url) {
    return {
      url,
      https_ok: false,
      http_status: null,
      load_ok: false,
      axe_violations: null,
      axe_summary: null,
      page_title: null,
      check_mode: "fetch_only",
    };
  }

  // --- Tier 1: Cloudflare Browser Rendering + axe-core ---
  const browserBinding = getBrowserBinding();
  if (browserBinding) {
    try {
      return await runWithBrowser(url, https_ok, browserBinding);
    } catch {
      // Browser path failed (binding present but launch/nav/axe threw). Fall
      // through to the fetch fallback rather than failing the submission.
    }
  }

  // --- Tier 2: plain fetch fallback ---
  return await runWithFetch(url, https_ok);
}

/**
 * Read the BROWSER binding off the Cloudflare env without throwing. Returns
 * undefined in local dev / opennextjs (no Workers context, or binding unset),
 * which routes the caller to the fetch fallback.
 */
function getBrowserBinding(): unknown {
  try {
    const env = getEnv() as unknown as { BROWSER?: unknown };
    return env.BROWSER ?? undefined;
  } catch {
    // getEnv() throws outside the Workers runtime — fetch fallback handles it.
    return undefined;
  }
}

/**
 * Headless path: launch Browser Rendering, load the page, capture status +
 * title, inject axe-core and run it. Puppeteer is imported dynamically so the
 * module still type-checks and runs in environments where the package can't be
 * resolved in the bundler graph; the import failing simply routes to fetch.
 */
async function runWithBrowser(
  url: string,
  https_ok: boolean,
  browserBinding: unknown
): Promise<AutoCheckResult> {
  // Dynamic import keeps the dependency out of the local-dev/fetch path and
  // lets a resolution failure degrade to fetch_only instead of crashing.
  const puppeteer = (await import("@cloudflare/puppeteer")).default;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browser = await puppeteer.launch(browserBinding as any);
  try {
    const page = await browser.newPage();
    await applyAntiBotDefaults(page);

    let http_status: number | null = null;
    try {
      const response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: NAV_TIMEOUT_MS,
      });
      http_status = response ? response.status() : null;
    } catch {
      // Navigation timed out or errored. Still try to read whatever loaded.
      http_status = null;
    }

    const load_ok =
      http_status != null ? http_status >= 200 && http_status < 400 : false;

    let page_title: string | null = null;
    try {
      page_title = await page.title();
      if (page_title === "") page_title = null;
    } catch {
      page_title = null;
    }

    // Inject + run axe-core in-page. Scope the run to the top document only and
    // to violations: axe's default traversal of cross-origin iframes (common on
    // .gov pages) rejects with "Frame does not exist" and would otherwise null
    // out the whole result. We swallow nothing silently — failures are logged so
    // the corroboration gap is visible in worker logs.
    let axe_violations: number | null = null;
    let axe_summary: AutoCheckResult["axe_summary"] = null;
    try {
      await page.addScriptTag({ url: AXE_CDN_URL });
      const results = (await page.evaluate(async () => {
        // axe is injected into the page global by the script tag above. Run
        // against the top document only (iframes:false) and ask for violations
        // only.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await (globalThis as any).axe.run(document, {
          iframes: false,
          resultTypes: ["violations"],
        });
      })) as AxeRunResult;

      const violations = results?.violations ?? [];
      axe_summary = violations.map((v) => ({
        id: v.id,
        impact: v.impact ?? null,
        count: Array.isArray(v.nodes) ? v.nodes.length : 0,
      }));
      axe_violations = axe_summary.reduce((sum, v) => sum + v.count, 0);
    } catch (err) {
      // axe injection/run failed — keep the load/title data, leave axe null, but
      // surface the reason. The corroboration layer treats null axe as neutral.
      console.error("[gov-audit] axe-core run failed:", err instanceof Error ? err.message : String(err));
      axe_violations = null;
      axe_summary = null;
    }

    return {
      url,
      https_ok,
      http_status,
      load_ok,
      axe_violations,
      axe_summary,
      page_title,
      check_mode: "browser_rendering",
    };
  } finally {
    // Always release the browser session.
    try {
      await browser.close();
    } catch {
      // ignore close errors
    }
  }
}

/**
 * Fetch fallback: a plain GET, following redirects. Sets http_status / load_ok
 * and best-effort extracts <title>. No axe (can't run JS on a raw response).
 * Resolves load_ok:false / nulls if the fetch itself throws (DNS / network).
 */
async function runWithFetch(
  url: string,
  https_ok: boolean
): Promise<AutoCheckResult> {
  try {
    const res = await fetch(url, { method: "GET", redirect: "follow" });
    const http_status = res.status;
    const load_ok = res.ok;

    let page_title: string | null = null;
    try {
      const html = await res.text();
      page_title = extractTitle(html);
    } catch {
      page_title = null;
    }

    return {
      url,
      https_ok,
      http_status,
      load_ok,
      axe_violations: null,
      axe_summary: null,
      page_title,
      check_mode: "fetch_only",
    };
  } catch {
    // Network / DNS failure — the page is unreachable from the server.
    return {
      url,
      https_ok,
      http_status: null,
      load_ok: false,
      axe_violations: null,
      axe_summary: null,
      page_title: null,
      check_mode: "fetch_only",
    };
  }
}

// ---------- Embed preview (PRD §13 Q1: headless-backed remote browser) ----------

export interface PagePreviewResult {
  url: string; // stripped origin+path
  resolved_url: string; // final URL after redirects (stripped), for nav-trail
  page_title: string | null;
  http_status: number | null;
  load_ok: boolean;
  /** Base64 PNG screenshot of the viewport, or null when no headless browser is
   *  available (local dev / opennextjs). The UI degrades to an open-in-new-tab
   *  card in that case. */
  screenshot_b64: string | null;
  mode: "browser_rendering" | "fetch_only";
}

/** Viewport the headless browser renders the embed at — desktop, since the
 *  evaluation flow is desktop-only (PRD §3). */
const EMBED_VIEWPORT = { width: 1280, height: 800 };

/**
 * Realistic Chrome UA — drops "HeadlessChrome", which is the single biggest
 * tell that the simpler bot-defense layers (Akamai's basic checks, Cloudflare
 * Bot Fight Mode) latch onto. This won't get past Akamai Bot Manager or Imperva
 * on a site like nyc.gov — those use IP reputation + behavioral fingerprinting
 * that headless from a datacenter IP cannot fake. The user-facing result there
 * is an "Access Denied" page (see isAccessDeniedFrame below); we surface a
 * "open in new tab" fallback rather than silently render the block page.
 */
const EMBED_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyAntiBotDefaults(page: any): Promise<void> {
  try {
    await page.setUserAgent(EMBED_UA);
  } catch {
    /* ignore */
  }
  try {
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Sec-Ch-Ua": '"Chromium";v="131", "Not_A Brand";v="24", "Google Chrome";v="131"',
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": '"macOS"',
    });
  } catch {
    /* ignore */
  }
  // Hide the navigator.webdriver flag (the second biggest tell).
  try {
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });
  } catch {
    /* ignore */
  }
}

/** Heuristic: did the page we landed on look like an anti-bot block page (Akamai
 *  "Access Denied", Cloudflare challenge, etc.)? Used to surface a clear fallback
 *  to the volunteer instead of letting them stare at an opaque error. */
export function isBlockedPageTitle(title: string | null | undefined, bodyText?: string | null): boolean {
  const t = (title ?? "").toLowerCase();
  const b = (bodyText ?? "").toLowerCase();
  return (
    /access denied|forbidden|attention required|please verify|just a moment|are you human|blocked/.test(t) ||
    /access denied|edgesuite\.net|cf-error|cloudflare|perimeterx|imperva|incapsula|akamai/.test(b)
  );
}

/**
 * Render a server-side preview of a page for the in-task embed. Uses Browser
 * Rendering to produce a real screenshot (sidestepping X-Frame-Options / CSP
 * entirely — we render a screenshot, not an iframe). Degrades to a metadata-only
 * fetch result (no screenshot) when the binding is absent. NEVER throws.
 */
export async function renderPagePreview(rawUrl: string): Promise<PagePreviewResult> {
  const url = stripUrl(rawUrl);
  if (!url || !/^https?:\/\//.test(url)) {
    return { url, resolved_url: url, page_title: null, http_status: null, load_ok: false, screenshot_b64: null, mode: "fetch_only" };
  }

  const browserBinding = getBrowserBinding();
  if (browserBinding) {
    try {
      const puppeteer = (await import("@cloudflare/puppeteer")).default;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const browser = await puppeteer.launch(browserBinding as any);
      try {
        const page = await browser.newPage();
        await page.setViewport(EMBED_VIEWPORT);
        await applyAntiBotDefaults(page);
        let http_status: number | null = null;
        let resolved = url;
        try {
          const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
          http_status = response ? response.status() : null;
          try {
            const u = page.url();
            resolved = /^https?:\/\//.test(u) ? stripUrl(u) : url;
          } catch {
            resolved = url;
          }
        } catch {
          http_status = null;
        }
        let page_title: string | null = null;
        try {
          page_title = (await page.title()) || null;
        } catch {
          page_title = null;
        }
        let screenshot_b64: string | null = null;
        try {
          const shot = (await page.screenshot({ type: "png", encoding: "base64" })) as unknown as string;
          screenshot_b64 = typeof shot === "string" ? shot : null;
        } catch {
          screenshot_b64 = null;
        }
        return {
          url,
          resolved_url: resolved,
          page_title,
          http_status,
          load_ok: http_status != null ? http_status >= 200 && http_status < 400 : false,
          screenshot_b64,
          mode: "browser_rendering",
        };
      } finally {
        try {
          await browser.close();
        } catch {
          /* ignore */
        }
      }
    } catch {
      // fall through to fetch
    }
  }

  // Fetch fallback — metadata only, no screenshot.
  const check = await runWithFetch(url, url.startsWith("https://"));
  return {
    url,
    resolved_url: url,
    page_title: check.page_title,
    http_status: check.http_status,
    load_ok: check.load_ok,
    screenshot_b64: null,
    mode: "fetch_only",
  };
}

/** Best-effort <title> extraction from raw HTML. Returns null if none found. */
function extractTitle(html: string): string | null {
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!m) return null;
  const title = m[1].replace(/\s+/g, " ").trim();
  return title.length > 0 ? title : null;
}
