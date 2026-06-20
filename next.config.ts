import type { NextConfig } from "next";

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
};

export default nextConfig;

// Enables Cloudflare bindings (DB, FILES, env vars) in `next dev`.
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
