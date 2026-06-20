import { requireAdmin } from "@/lib/session";
import { PilotBanner } from "@/components/pilot-banner";
import { AdminHeader } from "@/components/admin-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <AdminHeader user={{ name: user.full_name ?? "Admin", email: user.email }} />
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
    </>
  );
}
