import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center | colift",
  // Soft-launch: reachable by URL, not indexed by search engines.
  // See app/help/PENDING_UPDATES.md before removing this.
  robots: { index: false, follow: false, nocache: true },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
