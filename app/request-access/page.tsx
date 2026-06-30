import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requestAccess } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Request access | colift" };

export default async function RequestAccessPage({
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
      <SiteHeader />
      <main id="main" className="flex-1 bg-section">
        <div className="mx-auto max-w-[720px] px-4 py-16 md:px-6 md:py-20">
          {submitted ? (
            <div className="rounded-lg border border-line bg-white p-8 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-forest-subtle text-forest">
                <CheckCircle2 className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-5 text-[28px] font-semibold text-ink">Request received</h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-body">
                Thanks — we&rsquo;ve got your request and will be in touch at the email you
                provided. Colift is onboarding partner organizations one at a time right now.
              </p>
              <div className="mt-7">
                <Button asChild variant="secondary">
                  <Link href="/">Back home</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                <Building2 className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-4 text-[34px] font-semibold leading-tight text-ink">
                Request organization access
              </h1>
              <p className="mt-3 max-w-[560px] leading-relaxed text-body">
                Colift is onboarding sponsoring organizations individually while we&rsquo;re in
                pilot. Tell us about your org and we&rsquo;ll set you up and reach out personally.
              </p>

              {error && (
                <div className="mt-6 rounded-lg border border-line bg-brick-subtle p-4">
                  <p className="text-sm font-medium text-brick">
                    Please add a valid email and your organization name, then resubmit.
                  </p>
                </div>
              )}

              <form action={requestAccess} className="mt-8 space-y-5 rounded-lg border border-line bg-white p-6 md:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="org">Organization</Label>
                    <Input id="org" name="org" required placeholder="Sacramento Tree Foundation" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Work email</Label>
                    <Input id="email" name="email" type="email" required placeholder="you@org.org" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="role">
                    Your role <span className="font-normal text-meta">(optional)</span>
                  </Label>
                  <Input id="role" name="role" placeholder="Volunteer coordinator" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">
                    Anything else? <span className="font-normal text-meta">(optional)</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="What kind of volunteer work would you sponsor, and roughly how many people?"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit">
                    Send request <ArrowRight />
                  </Button>
                </div>
                <p className="text-xs leading-relaxed text-meta">
                  By requesting access you agree to our{" "}
                  <Link href="/terms" className="text-forest underline">Terms</Link> and{" "}
                  <Link href="/help/11-privacy" className="text-forest underline">Privacy Policy</Link>.
                </p>
              </form>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
