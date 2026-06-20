import { requireRecipient } from "@/lib/session";
import { PilotBanner } from "@/components/pilot-banner";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRecipient();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <AppHeader
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
