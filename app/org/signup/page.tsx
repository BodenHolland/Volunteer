import Link from "next/link";
import { ArrowRight, CheckCircle2, Building2, MailCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PilotBanner } from "@/components/pilot-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createOrgSignup } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Become a partner — Tended" };

export default async function OrgSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const submitted = sp.submitted === "1";
  const error = sp.error === "1";

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <SiteHeader />
      <main id="main" className="flex-1 bg-section">
        <div className="mx-auto max-w-[720px] px-4 py-16 md:px-6 md:py-20">
          {submitted ? (
            <div className="rounded-lg border border-line bg-white p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-forest-subtle text-forest">
                <MailCheck className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-5 text-[28px] font-semibold text-ink">You&apos;re on the list</h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-body">
                Your organization has been created with a pending status. In the live program
                we&apos;d email a magic link to the contact address to finish setting up your
                workspace and verify your details.
              </p>
              <div className="mx-auto mt-6 max-w-md rounded-lg border border-line bg-amber-subtle p-4 text-left">
                <p className="text-sm leading-relaxed text-amber">
                  This is a pilot demo, so no email is actually sent and no review happens. Your
                  entry was saved so you can see the flow end to end.
                </p>
              </div>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild variant="secondary">
                  <Link href="/for-organizations">Back to organizations</Link>
                </Button>
                <Button asChild>
                  <Link href="/how-it-works#for-organizations">How certification works <ArrowRight /></Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                <Building2 className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-4 text-[34px] font-semibold leading-tight text-ink">Become a partner</h1>
              <p className="mt-3 max-w-[560px] leading-relaxed text-body">
                Tell us about your organization. Any 501(c)(3) nonprofit, government agency, public
                school, or food bank can host civic tasks and certify hours. We&apos;ll create your
                workspace right away and follow up with a magic link.
              </p>

              {error && (
                <div className="mt-6 rounded-lg border border-line bg-brick-subtle p-4">
                  <p className="text-sm font-medium text-brick">
                    Something looked off in the form. Please check the organization name, contact
                    name, and email, then try again.
                  </p>
                </div>
              )}

              <form action={createOrgSignup} className="mt-8 space-y-5 rounded-lg border border-line bg-white p-6 md:p-8">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Organization name</Label>
                  <Input id="name" name="name" required placeholder="Friends of the Urban Forest" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ein">EIN <span className="font-normal text-meta">(optional)</span></Label>
                    <Input id="ein" name="ein" placeholder="94-2698044" inputMode="numeric" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_name">Your name</Label>
                    <Input id="contact_name" name="contact_name" required placeholder="Daniel Okafor" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_email">Contact email</Label>
                  <Input id="contact_email" name="contact_email" type="email" required placeholder="you@yourorg.org" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="about">About your organization <span className="font-normal text-meta">(optional)</span></Label>
                  <Textarea id="about" name="about" rows={4} placeholder="A sentence or two on what you do and the kind of civic work you'd host." />
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <p className="text-xs leading-relaxed text-meta">
                    By submitting you confirm your organization is eligible to certify hours.
                  </p>
                  <Button type="submit">Create workspace <ArrowRight /></Button>
                </div>
              </form>

              <ul className="mt-6 space-y-2 text-sm text-body">
                {[
                  "Your workspace is created instantly.",
                  "We follow up with a magic-link email to verify your details.",
                  "No state pre-approval is required to host tasks.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" strokeWidth={1.5} />
                    <span>{t}</span>
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
