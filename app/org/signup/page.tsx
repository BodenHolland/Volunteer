import Link from "next/link";
import { ArrowRight, CheckCircle2, Building2, MailCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDict } from "@/lib/i18n";
import { createOrgSignup } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Become a partner | colift" };

export default async function OrgSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const submitted = sp.submitted === "1";
  const error = sp.error === "1";
  const { locale, t } = await getDict();

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1 bg-section">
        <div className="mx-auto max-w-[720px] px-4 py-16 md:px-6 md:py-20">
          {submitted ? (
            <div className="rounded-lg border border-line bg-white p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-forest-subtle text-forest">
                <MailCheck className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-5 text-[28px] font-semibold text-ink">{t.orgSignup.onListTitle}</h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-body">
                {t.orgSignup.onListBody}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild variant="secondary">
                  <Link href="/for-organizations">{t.orgSignup.backToOrgs}</Link>
                </Button>
                <Button asChild>
                  <Link href="/how-it-works#for-organizations">{t.orgSignup.howCertWorks} <ArrowRight /></Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                <Building2 className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-4 text-[34px] font-semibold leading-tight text-ink">{t.orgSignup.becomePartner}</h1>
              <p className="mt-3 max-w-[560px] leading-relaxed text-body">
                {t.orgSignup.intro}
              </p>

              {error && (
                <div className="mt-6 rounded-lg border border-line bg-brick-subtle p-4">
                  <p className="text-sm font-medium text-brick">
                    {t.orgSignup.formError}
                  </p>
                </div>
              )}

              <form action={createOrgSignup} className="mt-8 space-y-5 rounded-lg border border-line bg-white p-6 md:p-8">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t.orgSignup.orgName}</Label>
                  <Input id="name" name="name" required placeholder="Community Tree Project" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ein">EIN <span className="font-normal text-meta">{t.orgSignup.optional}</span></Label>
                    <Input id="ein" name="ein" placeholder="94-2698044" inputMode="numeric" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_name">{t.orgSignup.yourName}</Label>
                    <Input id="contact_name" name="contact_name" required placeholder="Daniel Okafor" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_email">{t.orgSignup.contactEmail}</Label>
                  <Input id="contact_email" name="contact_email" type="email" required placeholder="you@yourorg.org" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="about">{t.orgSignup.about} <span className="font-normal text-meta">{t.orgSignup.optional}</span></Label>
                  <Textarea id="about" name="about" rows={4} placeholder={t.orgSignup.aboutPlaceholder} />
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <p className="text-xs leading-relaxed text-meta">
                    {t.orgSignup.confirmEligible}
                  </p>
                  <Button type="submit">{t.orgSignup.createWorkspace} <ArrowRight /></Button>
                </div>
              </form>

              <ul className="mt-6 space-y-2 text-sm text-body">
                {[
                  t.orgSignup.bullet0,
                  t.orgSignup.bullet1,
                  t.orgSignup.bullet2,
                ].map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" strokeWidth={1.5} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
