import type { MetadataRoute } from "next";
import { isDemoMode } from "@/lib/cf";

/** Indexable in production; kept out of search indexes in DEMO_MODE. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: isDemoMode()
      ? { userAgent: "*", disallow: "/" }
      : { userAgent: "*", allow: "/" },
  };
}
