import Link from "next/link";
import { ArrowRight, MessageSquare, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getDict } from "@/lib/i18n";
import { submitContact } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact | colift" };

export default async function ContactPage({
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
                <CheckCircle2 className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-5 text-[28px] font-semibold text-ink">{t.contact.thanksTitle}</h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-body">
                {t.contact.thanksBody}
              </p>
              <div className="mt-7">
                <Button asChild variant="secondary">
                  <Link href="/">{t.contact.backHome}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                <MessageSquare className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-4 text-[34px] font-semibold leading-tight text-ink">{t.contact.title}</h1>
              <p className="mt-3 max-w-[560px] leading-relaxed text-body">
                {t.contact.subtitle}
              </p>

              {error && (
                <div className="mt-6 rounded-lg border border-line bg-brick-subtle p-4">
                  <p className="text-sm font-medium text-brick">
                    {t.contact.errorMsg}
                  </p>
                </div>
              )}

              <form action={submitContact} className="mt-8 space-y-5 rounded-lg border border-line bg-white p-6 md:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t.contact.yourName} <span className="font-normal text-meta">{t.contact.optional}</span></Label>
                    <Input id="name" name="name" placeholder="Jordan Lee" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{t.contact.email}</Label>
                    <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">{t.contact.message}</Label>
                  <Textarea id="message" name="message" rows={6} required placeholder={t.contact.messagePlaceholder} />
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit">{t.contact.send} <ArrowRight /></Button>
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
