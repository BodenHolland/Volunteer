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

import { stripUrl, checkSsrfUrl } from "./gov-audit";
import type { SsrfRefusalReason } from "./gov-audit";
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

/** Hard timeout for the fallback fetch (SSRF: bound server-side dwell time). */
const FETCH_TIMEOUT_MS = 15_000;

/** Response-size cap for the fallback fetch body read (SSRF: bound readout /
 *  memory). 2 MiB is ample for a <title> scrape. */
const FETCH_MAX_BYTES = 2 * 1024 * 1024;

/** Redirect-hop cap for the manual-redirect fallback fetch. Every hop is
 *  re-validated against the SSRF gate before it is followed. */
const FETCH_MAX_REDIRECTS = 5;

/**
 * Build a refused AutoCheckResult — used whenever the SSRF gate rejects a URL.
 * Shape matches a fetch_only miss but carries no readout: load_ok:false, no
 * title, no axe, no status. NEVER throws; the caller treats this as a normal
 * "couldn't check" result.
 */
function refusedAutoCheck(url: string, _reason: SsrfRefusalReason): AutoCheckResult {
  return {
    url,
    https_ok: false,
    http_status: null,
    load_ok: false,
    axe_violations: null,
    axe_summary: null,
    page_title: null,
    check_mode: "skipped",
  };
}

/**
 * Run the server-side auto-check for one anchor URL.
 *
 * @param rawUrl the anchor URL (may carry a query string — stripped first).
 * @returns always resolves; never rejects.
 */
export async function runAutoCheck(rawUrl: string): Promise<AutoCheckResult> {
  const url = stripUrl(rawUrl);
  const https_ok = url.startsWith("https://");

  // HARD SSRF GATE — before any navigation/fetch. A refused URL resolves a
  // no-readout "skipped" result; it never reaches puppeteer or fetch.
  const gate = checkSsrfUrl(url);
  if (!gate.ok) {
    return refusedAutoCheck(url, gate.reason ?? "unparseable");
  }

  // --- Tier 1: Cloudflare Browser Rendering + axe-core ---
  const browserBinding = getBrowserBinding();
  if (browserBinding) {
    try {
      return await withBrowserPage(browserBinding, (page) =>
        autoCheckOnPage(page, url, https_ok)
      );
    } catch {
      // Browser path failed (binding present but launch/nav/axe threw). Fall
      // through to the fetch fallback rather than failing the submission.
    }
  }

  // --- Tier 2: plain fetch fallback ---
  return await runWithFetch(url, https_ok);
}

/**
 * Batch auto-check: open ONE Browser Rendering session and run all URLs through
 * it, reusing the single browser, closing once. Each URL is independently
 * SSRF-gated and never breaks the batch. Falls back to per-URL fetch for any URL
 * when no browser binding is available, or for an individual URL if the in-page
 * check throws. NEVER throws.
 *
 * This is the preferred entry point when processing several anchors at once —
 * Browser Rendering has a low per-account concurrency cap and is billed per
 * session, so one session for N URLs beats N sessions.
 */
export async function runAutoChecksBatch(
  binding: unknown,
  urls: string[]
): Promise<AutoCheckResult[]> {
  // Pre-strip + gate every URL up front so the order/length is stable.
  const prepared = urls.map((raw) => {
    const url = stripUrl(raw);
    return { url, https_ok: url.startsWith("https://"), gate: checkSsrfUrl(url) };
  });

  const browserBinding = binding ?? getBrowserBinding();

  if (browserBinding) {
    try {
      return await withBrowserPageFactory(browserBinding, async (newPage) => {
        const out: AutoCheckResult[] = [];
        for (const p of prepared) {
          if (!p.gate.ok) {
            out.push(refusedAutoCheck(p.url, p.gate.reason ?? "unparseable"));
            continue;
          }
          try {
            const page = await newPage();
            try {
              out.push(await autoCheckOnPage(page, p.url, p.https_ok));
            } finally {
              try {
                await page.close();
              } catch {
                /* ignore */
              }
            }
          } catch {
            // In-page check failed for this URL — degrade to fetch for it.
            out.push(await runWithFetch(p.url, p.https_ok));
          }
        }
        return out;
      });
    } catch {
      // Browser launch failed entirely — fall through to per-URL fetch below.
    }
  }

  // No browser (or launch failed): fetch fallback per URL, gate-respecting.
  const out: AutoCheckResult[] = [];
  for (const p of prepared) {
    if (!p.gate.ok) {
      out.push(refusedAutoCheck(p.url, p.gate.reason ?? "unparseable"));
    } else {
      out.push(await runWithFetch(p.url, p.https_ok));
    }
  }
  return out;
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
 * BROWSER LIFECYCLE REUSE.
 *
 * Launch ONE Browser Rendering session, run `fn` with a `newPage` factory, and
 * close the browser exactly once in a finally. Callers that need many pages on
 * one session (the batch path) use this directly. Browser Rendering has a low
 * per-account concurrency cap and is billed per session, so a fresh browser per
 * URL is wasteful — this helper is the single launch/close point.
 *
 * Puppeteer is imported dynamically so the module still type-checks and runs in
 * environments where the package can't be resolved in the bundler graph; the
 * import failing simply lets the caller degrade to fetch.
 */
async function withBrowserPageFactory<T>(
  browserBinding: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (newPage: () => Promise<any>) => Promise<T>
): Promise<T> {
  const puppeteer = (await import("@cloudflare/puppeteer")).default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const browser = await puppeteer.launch(browserBinding as any);
  try {
    return await fn(() => browser.newPage());
  } finally {
    try {
      await browser.close();
    } catch {
      // ignore close errors
    }
  }
}

/**
 * Convenience wrapper: launch one browser, open one page, run `fn`, close once.
 * The page is created inside the factory so the single-URL paths share the exact
 * same launch/close discipline as the batch path.
 */
async function withBrowserPage<T>(
  browserBinding: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (page: any) => Promise<T>
): Promise<T> {
  return withBrowserPageFactory(browserBinding, async (newPage) => {
    const page = await newPage();
    try {
      return await fn(page);
    } finally {
      try {
        await page.close();
      } catch {
        /* ignore */
      }
    }
  });
}

/**
 * Headless per-page auto-check: on an already-opened page, load the URL, capture
 * status + title, inject axe-core and run it. Assumes the URL has ALREADY passed
 * the SSRF gate. Re-validates the final post-redirect URL and refuses (returns a
 * skipped result, no axe) if navigation left the allowlist.
 */
async function autoCheckOnPage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  url: string,
  https_ok: boolean
): Promise<AutoCheckResult> {
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

  // Re-validate the post-redirect landing URL: navigation may have followed
  // redirects off the allowlist (or to a private host). If so, refuse readout.
  try {
    const finalUrl = page.url();
    if (typeof finalUrl === "string" && finalUrl) {
      const gate = checkSsrfUrl(finalUrl);
      if (!gate.ok) {
        return refusedAutoCheck(stripUrl(finalUrl) || url, gate.reason ?? "not_official");
      }
    }
  } catch {
    /* if we can't read the URL, fall through and return what we have */
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
}

/**
 * Fetch fallback: a plain GET with MANUAL redirect handling. Every hop is
 * re-validated against the SSRF gate before it is followed (redirect:"manual"),
 * so a 30x to a private host / off-allowlist target is refused mid-chain rather
 * than transparently followed. Bounded by an AbortSignal timeout and a
 * response-size cap on the body read. Best-effort extracts <title>; no axe.
 * Assumes `url` already passed the gate. Resolves load_ok:false / nulls on any
 * failure (network / DNS / refused redirect / timeout). NEVER throws.
 */
async function runWithFetch(
  url: string,
  https_ok: boolean
): Promise<AutoCheckResult> {
  const miss = (status: number | null): AutoCheckResult => ({
    url,
    https_ok,
    http_status: status,
    load_ok: false,
    axe_violations: null,
    axe_summary: null,
    page_title: null,
    check_mode: "fetch_only",
  });

  let current = url;
  try {
    for (let hop = 0; hop <= FETCH_MAX_REDIRECTS; hop++) {
      // Re-validate the hop target (the initial URL is already gated, but every
      // subsequent Location is attacker-influenced and must be re-checked).
      if (hop > 0) {
        const gate = checkSsrfUrl(current);
        if (!gate.ok) return miss(null); // refused redirect — no readout.
      }

      const res = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      // Manual redirect: 30x with a Location → validate + follow.
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get("location");
        if (!loc) return miss(res.status); // redirect with no target.
        try {
          current = new URL(loc, current).toString();
        } catch {
          return miss(res.status);
        }
        continue; // loop re-validates the new target at the top.
      }

      // Terminal (non-redirect) response.
      const http_status = res.status;
      const load_ok = res.ok;

      let page_title: string | null = null;
      try {
        const html = await readBodyCapped(res, FETCH_MAX_BYTES);
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
    }
    // Exhausted the redirect budget.
    return miss(null);
  } catch {
    // Network / DNS failure / timeout — the page is unreachable server-side.
    return miss(null);
  }
}

/**
 * Read a response body as text, aborting once `maxBytes` is reached. Bounds
 * server-side memory + readout for the SSRF-sensitive fallback fetch. Returns
 * the decoded text of (at most) the first maxBytes.
 */
async function readBodyCapped(res: Response, maxBytes: number): Promise<string> {
  const body = res.body;
  if (!body) {
    // No stream available — fall back to text() but still bound it.
    const t = await res.text();
    return t.length > maxBytes ? t.slice(0, maxBytes) : t;
  }
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        total += value.byteLength;
        if (total >= maxBytes) break;
      }
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
  }
  const merged = new Uint8Array(Math.min(total, maxBytes));
  let offset = 0;
  for (const c of chunks) {
    if (offset >= merged.length) break;
    const slice = c.subarray(0, merged.length - offset);
    merged.set(slice, offset);
    offset += slice.length;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(merged);
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

  // A refused preview: normal shape, load_ok:false, NO screenshot. The mode
  // signals the refusal so the UI degrades to an open-in-new-tab card.
  const refused = (): PagePreviewResult => ({
    url,
    resolved_url: url,
    page_title: null,
    http_status: null,
    load_ok: false,
    screenshot_b64: null,
    mode: "fetch_only",
  });

  // HARD SSRF GATE — before any navigation/fetch. Refused URLs never reach
  // puppeteer or fetch and never produce a screenshot.
  if (!checkSsrfUrl(url).ok) {
    return refused();
  }

  const browserBinding = getBrowserBinding();
  if (browserBinding) {
    try {
      return await withBrowserPage(browserBinding, async (page) => {
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

        // Re-validate the post-redirect landing URL. If navigation left the
        // allowlist (or reached a private host), refuse: no screenshot, no
        // title readout.
        try {
          const finalUrl = page.url();
          if (typeof finalUrl === "string" && finalUrl && !checkSsrfUrl(finalUrl).ok) {
            return refused();
          }
        } catch {
          /* if we can't read the URL, fall through with what we have */
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
      });
    } catch {
      // fall through to fetch
    }
  }

  // Fetch fallback — metadata only, no screenshot. (URL already gated above;
  // runWithFetch re-validates every redirect hop.)
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
