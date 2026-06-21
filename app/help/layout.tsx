import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help Center (Draft) — Tended",
  robots: { index: false, follow: false, nocache: true },
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
