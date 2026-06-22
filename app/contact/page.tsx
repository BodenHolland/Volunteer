import Link from "next/link";
import { ArrowRight, MessageSquare, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLocale } from "@/lib/i18n";
import { submitContact } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact — Tended" };

const COPY = {
  en: {
    thanksTitle: "Thanks for reaching out",
    thanksBody1: "We’ve received your message and saved it. We’ll reply to the email you provided.",
    backHome: "Back home",
    contactTitle: "Contact us",
    contactSub: "Questions about Tended, hosting tasks, or certifying hours? Send us a note and we’ll get back to you.",
    errorMsg: "Please add a valid email and a short message, then try again.",
    yourName: "Your name",
    optional: "(optional)",
    email: "Email",
    message: "Message",
    messagePlaceholder: "How can we help?",
    send: "Send message",
  },
  es: {
    thanksTitle: "Gracias por escribirnos",
    thanksBody1: "Hemos recibido tu mensaje y lo guardamos. Responderemos al correo que indicaste.",
    backHome: "Volver al inicio",
    contactTitle: "Contáctanos",
    contactSub: "¿Tienes preguntas sobre Tended, ofrecer tareas o certificar horas? Envíanos una nota y te responderemos.",
    errorMsg: "Agrega un correo válido y un mensaje breve, luego inténtalo de nuevo.",
    yourName: "Tu nombre",
    optional: "(opcional)",
    email: "Correo electrónico",
    message: "Mensaje",
    messagePlaceholder: "¿En qué podemos ayudarte?",
    send: "Enviar mensaje",
  },
} as const;

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const submitted = sp.submitted === "1";
  const error = sp.error === "1";
  const locale = await getLocale();
  const c = COPY[locale];

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
              <h1 className="mt-5 text-[28px] font-semibold text-ink">{c.thanksTitle}</h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-body">
                {c.thanksBody1}
              </p>
              <div className="mt-7">
                <Button asChild variant="secondary">
                  <Link href="/">{c.backHome}</Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                <MessageSquare className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-4 text-[34px] font-semibold leading-tight text-ink">{c.contactTitle}</h1>
              <p className="mt-3 max-w-[560px] leading-relaxed text-body">
                {c.contactSub}
              </p>

              {error && (
                <div className="mt-6 rounded-lg border border-line bg-brick-subtle p-4">
                  <p className="text-sm font-medium text-brick">
                    {c.errorMsg}
                  </p>
                </div>
              )}

              <form action={submitContact} className="mt-8 space-y-5 rounded-lg border border-line bg-white p-6 md:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{c.yourName} <span className="font-normal text-meta">{c.optional}</span></Label>
                    <Input id="name" name="name" placeholder="Jordan Lee" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">{c.email}</Label>
                    <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">{c.message}</Label>
                  <Textarea id="message" name="message" rows={6} required placeholder={c.messagePlaceholder} />
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit">{c.send} <ArrowRight /></Button>
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
