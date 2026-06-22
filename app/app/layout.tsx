import { requireRecipient } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireRecipient();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
