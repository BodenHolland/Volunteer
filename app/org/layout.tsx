import { getCurrentUser } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Public segments under /org (e.g. /org/signup) render without org chrome;
  // guarded pages call requireOrgMember()/requireOrgAdmin() themselves.
  if (!user || user.role !== "org_member" || !user.org_id) {
    return <>{children}</>;
  }
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
    </>
  );
}
