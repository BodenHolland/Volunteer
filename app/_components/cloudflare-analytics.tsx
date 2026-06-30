/**
 * Cloudflare Web Analytics beacon.
 *
 * Cookieless, no per-user identifier. Renders nothing unless
 * NEXT_PUBLIC_CF_BEACON_TOKEN is set, so local dev and pre-token
 * deploys stay analytics-free with no extra config.
 *
 * Token comes from Cloudflare dashboard → Analytics & Logs → Web Analytics
 * → add your site (any URL works for *.workers.dev) → copy the token.
 */
export function CloudflareAnalytics() {
  const token = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;
  if (!token) return null;
  return (
    <script
      defer
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={JSON.stringify({ token })}
    />
  );
}
