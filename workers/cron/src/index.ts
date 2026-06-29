/**
 * colift-cron — standalone Cloudflare Cron Worker (H9).
 *
 * The main `colift` Worker is built by @opennextjs/cloudflare, whose generated
 * `.open-next/worker.js` default-exports `fetch` ONLY — it emits no `scheduled()`
 * handler — so cron triggers cannot run jobs there. This tiny Worker owns the
 * cron trigger and, on each tick, makes an authenticated request to the app's
 * `/api/cron` route, which drains the Open Prices retry queue and runs the
 * retention/expiry sweep (lib/sweep.ts).
 *
 * There is deliberately NO `fetch` handler: a public fetch handler would let
 * anyone trigger the maintenance jobs unauthenticated. The cron trigger is the
 * only entrypoint. For a manual/operator run, POST the app route directly:
 *   curl -X POST "$APP_ORIGIN/api/cron" -H "authorization: Bearer $CRON_SECRET"
 *
 * One-time setup (see workers/cron/README.md):
 *   openssl rand -hex 32                                  # generate the shared secret
 *   wrangler secret put CRON_SECRET                       # on the main colift worker (repo root)
 *   wrangler secret put CRON_SECRET --config workers/cron/wrangler.jsonc
 *   wrangler deploy --config workers/cron/wrangler.jsonc  # deploy this worker
 */
export interface Env {
  APP_ORIGIN: string;
  CRON_SECRET: string;
}

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const res = await fetch(`${env.APP_ORIGIN}/api/cron`, {
          method: "POST",
          headers: { authorization: `Bearer ${env.CRON_SECRET}` },
        });
        if (!res.ok) {
          console.error(`cron run failed: ${res.status} ${(await res.text()).slice(0, 300)}`);
        }
      })()
    );
  },
};
