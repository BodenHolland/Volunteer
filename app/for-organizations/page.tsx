import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Eye,
  Stamp,
  Building2,
  Landmark,
  GraduationCap,
  Apple,
  CheckCircle2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "For organizations — Tended" };

const STEPS = {
  en: [
    {
      icon: ClipboardList,
      title: "Host tasks",
      body: "Post the civic work your organization needs — counting trees, translating notices, mapping hazards, documenting spaces. You set the instructions, the checklist, the time estimate, and the hours cap.",
    },
    {
      icon: Eye,
      title: "Review submissions",
      body: "Work comes into your queue with photos, notes, and an AI first-pass that flags likely duplicates or low-effort content. A reviewer on your team approves, requests changes, or rejects.",
    },
    {
      icon: Stamp,
      title: "Certify hours",
      body: "When you approve a submission, the credited hours are recorded. For recipients certifying SNAP hours, your approval becomes the organization section of their work-hours certification — the part that makes it valid.",
    },
  ],
  es: [
    {
      icon: ClipboardList,
      title: "Ofrece tareas",
      body: "Publica el trabajo cívico que tu organización necesita — contar árboles, traducir avisos, mapear peligros, documentar espacios. Tú defines las instrucciones, la lista de verificación, el tiempo estimado y el límite de horas.",
    },
    {
      icon: Eye,
      title: "Revisa los envíos",
      body: "El trabajo llega a tu cola con fotos, notas y una primera revisión de IA que marca posibles duplicados o contenido de poco esfuerzo. Un revisor de tu equipo aprueba, solicita cambios o rechaza.",
    },
    {
      icon: Stamp,
      title: "Certifica las horas",
      body: "Cuando apruebas un envío, las horas acreditadas quedan registradas. Para los beneficiarios que certifican horas de SNAP, tu aprobación se convierte en la sección de la organización en su certificación de horas — la parte que la hace válida.",
    },
  ],
} as const;

const ELIGIBLE = {
  en: [
    { icon: Building2, label: "501(c)(3) nonprofits" },
    { icon: Landmark, label: "Government agencies" },
    { icon: GraduationCap, label: "Public schools" },
    { icon: Apple, label: "Food banks" },
  ],
  es: [
    { icon: Building2, label: "Organizaciones sin fines de lucro 501(c)(3)" },
    { icon: Landmark, label: "Agencias gubernamentales" },
    { icon: GraduationCap, label: "Escuelas públicas" },
    { icon: Apple, label: "Bancos de alimentos" },
  ],
} as const;

const COPY = {
  en: {
    overline: "For organizations",
    title: "Put your work in front of neighbors who want to do it.",
    intro: "Sponsor civic tasks, review the work that comes back, and certify volunteer hours for the people you serve. For recipients meeting the new SNAP work requirement, your certification is the final piece.",
    becomePartner: "Become a partner",
    howCert: "How certification works",
    threeThings: "Three things you do",
    threeThingsSub: "Hosting on Tended is simple, and you stay in control of the work and the hours.",
    step: "Step",
    whoCanTitle: "Who can sponsor",
    whoCanBody: "There is no state pre-approval list to get onto. If your organization is one of these, you can host tasks and certify hours:",
    whatYouGetTitle: "What you get",
    whatYouGet: [
      "A queue of reviewed civic work, with AI flags surfaced for you.",
      "Real results from the field — data, translations, write-ups you can use.",
      "A simple way to certify SNAP hours without touching the state system yourself.",
      "More volunteers reached, with less stigma than benefit-first framing.",
    ],
    ctaTitle: "Ready to host civic work?",
    ctaBody: "Tell us about your organization — it takes a minute.",
  },
  es: {
    overline: "Para organizaciones",
    title: "Pon tu trabajo frente a los vecinos que quieren hacerlo.",
    intro: "Patrocina tareas cívicas, revisa el trabajo que regresa y certifica horas de voluntariado para las personas a las que sirves. Para los beneficiarios que cumplen el nuevo requisito de trabajo de SNAP, tu certificación es la pieza final.",
    becomePartner: "Conviértete en socio",
    howCert: "Cómo funciona la certificación",
    threeThings: "Tres cosas que haces",
    threeThingsSub: "Ofrecer tareas en Tended es sencillo, y tú mantienes el control del trabajo y de las horas.",
    step: "Paso",
    whoCanTitle: "Quién puede patrocinar",
    whoCanBody: "No hay una lista de aprobación previa del estado a la que haya que entrar. Si tu organización es una de estas, puedes ofrecer tareas y certificar horas:",
    whatYouGetTitle: "Lo que obtienes",
    whatYouGet: [
      "Una cola de trabajo cívico revisado, con las alertas de IA destacadas para ti.",
      "Resultados reales del campo — datos, traducciones, informes que puedes usar.",
      "Una forma sencilla de certificar horas de SNAP sin tocar tú mismo el sistema estatal.",
      "Más voluntarios alcanzados, con menos estigma que un enfoque centrado en los beneficios.",
    ],
    ctaTitle: "¿Listo para ofrecer trabajo cívico?",
    ctaBody: "Cuéntanos sobre tu organización — toma un minuto.",
  },
} as const;

export const dynamic = "force-dynamic";

export default async function ForOrganizationsPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const steps = STEPS[locale];
  const eligible = ELIGIBLE[locale];
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="mx-auto max-w-[720px] text-center">
              <h1 className="text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">
                {c.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                {c.intro}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/org/signup">{c.becomePartner} <ArrowRight /></Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/how-it-works#for-organizations">{c.howCert}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-[720px]">
            <h2 className="text-[28px] font-semibold text-ink">{c.threeThings}</h2>
            <p className="mt-2 leading-relaxed text-body">
              {c.threeThingsSub}
            </p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title}>
                <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <s.icon className="size-6" strokeWidth={1.5} />
                </div>
                <h3 className="mt-1 text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 leading-relaxed text-body">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Eligibility */}
        <section className="border-y border-line bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div className="max-w-[560px]">
                <h2 className="text-[28px] font-semibold text-ink">{c.whoCanTitle}</h2>
                <p className="mt-3 leading-relaxed text-body">
                  {c.whoCanBody}
                </p>
                <ul className="mt-5 space-y-2.5">
                  {eligible.map((e) => (
                    <li key={e.label} className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-white text-forest [&_svg]:size-[18px]">
                        <e.icon strokeWidth={1.5} />
                      </span>
                      <span className="font-medium text-ink">{e.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-line bg-white p-6">
                <h3 className="text-lg font-semibold text-ink">{c.whatYouGetTitle}</h3>
                <ul className="mt-4 space-y-3">
                  {c.whatYouGet.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-body">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" strokeWidth={1.5} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 px-4 py-16 md:flex-row md:items-center md:px-6">
          <div>
            <h2 className="text-[22px] font-semibold text-ink">{c.ctaTitle}</h2>
            <p className="mt-1 text-body">{c.ctaBody}</p>
          </div>
          <Button asChild size="lg">
            <Link href="/org/signup">{c.becomePartner} <ArrowRight /></Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
