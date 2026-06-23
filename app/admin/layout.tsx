import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/orgs", label: "Orgs" },
  { href: "/admin/tasks", label: "Tasks" },
  { href: "/admin/submissions", label: "Submissions" },
  { href: "/admin/audits", label: "Food audits" },
  { href: "/admin/gov-audits", label: "Website audits" },
  { href: "/admin/audit", label: "Audit log" },
  { href: "/admin/system", label: "System" },
  { href: "/admin/feedback", label: "Feedback" },
  { href: "/admin/reset", label: "Reset" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-[1200px] gap-1 overflow-x-auto px-4 py-2 md:px-6">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-body hover:bg-section hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
