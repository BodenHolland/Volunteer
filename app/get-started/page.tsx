import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { WelcomeChooser } from "@/components/welcome-chooser";
import { homeForUser, requireUser } from "@/lib/session";
import { getDict } from "@/lib/i18n";

export const metadata = { title: "Get started | colift" };
export const dynamic = "force-dynamic";

export default async function GetStartedPage() {
  const user = await requireUser();
  const { t } = await getDict();

  // If this account already has a role + intent set, send them to their home or
  // back into the /start wizard, the chooser is only for fresh accounts.
  if (user.role === "org_member") {
    redirect(user.org_id ? "/org" : "/start?step=orgpick");
  }
  if (user.role === "recipient" && user.intent && user.intent !== "n/a") {
    const onboarded = !!user.city && !!user.state;
    redirect(onboarded ? homeForUser(user) : "/start?step=location");
  }

  return (
    <main className="min-h-screen bg-[#f7fafc]">
      <header className="border-b border-navy-deep bg-navy">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-4 md:px-6">
          <Link
            href="/"
            className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <Logo size={24} className="text-xl text-white" />
          </Link>
        </div>
      </header>

      <div className="flex flex-col items-center px-4 py-12 md:py-16">
        <div className="w-full max-w-[640px] rounded-lg border border-line bg-white p-8 shadow-sm md:p-10">
          <h1 className="text-[28px] font-semibold leading-tight text-ink md:text-[32px]">
            {t.getStarted.heading}
          </h1>
          <p className="mt-3 text-sm text-body">
            {t.getStarted.subhead}
          </p>
          <div className="mt-7">
            <WelcomeChooser
              option0Title={t.getStarted.option0Title}
              option0Body={t.getStarted.option0Body}
              option1Title={t.getStarted.option1Title}
              option1Body={t.getStarted.option1Body}
              option2Title={t.getStarted.option2Title}
              option2Body={t.getStarted.option2Body}
              nextBtn={t.getStarted.nextBtn}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
