import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default {
  ...defineCloudflareConfig({
    // No incremental cache override needed for the demo; default in-memory is fine.
  }),
  // IMPORTANT: build the Next.js app with `next build` directly.
  //
  // OpenNext's default Next-build step runs the package manager's `build`
  // script (for pnpm that's `pnpm build`). Our package.json `build` script is
  // `opennextjs-cloudflare build`, so without this override OpenNext re-invokes
  // itself forever — an infinite recursion that Cloudflare Workers Builds
  // eventually kills with "An internal error occurred." Pinning buildCommand
  // breaks the loop.
  buildCommand: "next build",
};
