import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * Next.js inlines small bootstrap scripts and (with Tailwind / styled-jsx)
 * inline styles, so we allow 'unsafe-inline' for styles and, in dev, also
 * 'unsafe-eval' + 'unsafe-inline' for scripts (React Fast Refresh / HMR uses
 * eval). In production we still keep 'unsafe-inline' for scripts because the app
 * relies on Next's inline bootstrap without a nonce pipeline — this is
 * intentionally permissive-but-sane so the app doesn't break. Tighten with a
 * nonce-based CSP if/when the app is refactored for it.
 */
// Firebase Auth endpoints the client SDK talks to.
const FIREBASE_CONNECT = "https://*.googleapis.com https://volunteer-online-bcfa9.firebaseapp.com";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://apis.google.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "font-src 'self' data:",
  // OpenRouter (AI validation) + Firebase Auth + self; ws: for dev HMR.
  `connect-src 'self' https://openrouter.ai ${FIREBASE_CONNECT}${isDev ? " ws: http://localhost:*" : ""}`,
  // Firebase Google sign-in popup/iframe.
  "frame-src 'self' https://volunteer-online-bcfa9.firebaseapp.com https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  // HSTS — force HTTPS for 2 years incl. subdomains. (No-op on http://localhost.)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The food-price audit uses device geolocation (find nearby stores, stamp a
  // store's coordinates) and the camera (photograph items + shelf tags), so
  // allow both for our own origin. Everything else stays disabled.
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(self), microphone=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  // Hide the dev tools indicator so screenshots are clean.
  devIndicators: false,
  eslint: {
    // Demo: don't block builds on lint.
    ignoreDuringBuilds: true,
  },
  images: {
    // We don't use remote images; org thumbnails are generated inline.
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      // Food-audit captures a rear-camera photo per basket item; modern phones
      // produce 3–8 MB JPEGs and the default 1 MB cap silently rejects the
      // upload, leaving the "Save" button spinning. 20 MB covers a high-res
      // photo with headroom.
      bodySizeLimit: "20mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;

// Enables Cloudflare bindings (DB, FILES, env vars) in `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
