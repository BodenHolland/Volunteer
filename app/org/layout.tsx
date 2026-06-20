import { getCurrentUser } from "@/lib/session";
import { getOrg } from "@/lib/queries";
import { PilotBanner } from "@/components/pilot-banner";
import { OrgHeader } from "@/components/org-header";

export default async function OrgLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  // Public segments under /org (e.g. /org/signup) render without org chrome;
  // guarded pages call requireOrgMember()/requireOrgAdmin() themselves.
  if (!user || user.role !== "org_member" || !user.org_id) {
    return <>{children}</>;
  }
  const org = await getOrg(user.org_id);
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <OrgHeader
        user={{
          name: user.full_name ?? "You",
          email: user.email,
          orgName: org?.name ?? "Your organization",
          isAdmin: user.org_role === "org_admin",
        }}
      />
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
    </>
  );
}
