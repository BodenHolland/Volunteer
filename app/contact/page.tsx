import Link from "next/link";
import { ArrowRight, MessageSquare, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PilotBanner } from "@/components/pilot-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContact } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact — Tended" };

export default async function ContactPage({
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
                <CheckCircle2 className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-5 text-[28px] font-semibold text-ink">Thanks for reaching out</h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-body">
                We&apos;ve received your message. In the live program we&apos;d reply to the email
                you provided. This is a pilot demo, so no one is actually monitoring the inbox — but
                your note was saved.
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
                <MessageSquare className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-4 text-[34px] font-semibold leading-tight text-ink">Contact us</h1>
              <p className="mt-3 max-w-[560px] leading-relaxed text-body">
                Questions about the pilot, hosting tasks, or certifying hours? Send us a note and
                we&apos;ll get back to you.
              </p>

              {error && (
                <div className="mt-6 rounded-lg border border-line bg-brick-subtle p-4">
                  <p className="text-sm font-medium text-brick">
                    Please add a valid email and a short message, then try again.
                  </p>
                </div>
              )}

              <form action={submitContact} className="mt-8 space-y-5 rounded-lg border border-line bg-white p-6 md:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Your name <span className="font-normal text-meta">(optional)</span></Label>
                    <Input id="name" name="name" placeholder="Jordan Lee" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" name="message" rows={6} required placeholder="How can we help?" />
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit">Send message <ArrowRight /></Button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
