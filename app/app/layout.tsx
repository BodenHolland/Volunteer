import { requireRecipient } from "@/lib/session";
import { PilotBanner } from "@/components/pilot-banner";
import { AppHeader } from "@/components/app-header";
import { getDict } from "@/lib/i18n";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRecipient();
  const { locale, t } = await getDict();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <AppHeader
        locale={locale}
        labels={t.app.nav}
        user={{
          name: user.full_name ?? "You",
          email: user.email,
          intent: user.intent,
          isSnap: user.intent === "snap_cert",
        }}
      />
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6">
        {children}
      </main>
    </>
  );
}
