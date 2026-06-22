import Link from "next/link";
import { ArrowRight, CheckCircle2, Building2, MailCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getLocale } from "@/lib/i18n";
import { createOrgSignup } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Become a partner — Tended" };

const COPY = {
  en: {
    onListTitle: "You're on the list",
    onListBody:
      "Your organization has been created with a pending status. We'll email a magic link to your contact address to finish setting up your workspace and verify your details.",
    backToOrgs: "Back to organizations",
    howCertWorks: "How certification works",
    becomePartner: "Become a partner",
    intro:
      "Tell us about your organization. Any 501(c)(3) nonprofit, government agency, public school, or food bank can host civic tasks and certify hours. We'll create your workspace right away and follow up with a magic link.",
    formError:
      "Something looked off in the form. Please check the organization name, contact name, and email, then try again.",
    orgName: "Organization name",
    optional: "(optional)",
    yourName: "Your name",
    contactEmail: "Contact email",
    about: "About your organization",
    aboutPlaceholder: "A sentence or two on what you do and the kind of civic work you'd host.",
    confirmEligible: "By submitting you confirm your organization is eligible to certify hours.",
    createWorkspace: "Create workspace",
    bullet1: "Your workspace is created instantly.",
    bullet2: "We follow up with a magic-link email to verify your details.",
    bullet3: "No state pre-approval is required to host tasks.",
  },
  es: {
    onListTitle: "Estás en la lista",
    onListBody:
      "Tu organización se ha creado con estado pendiente. Te enviaremos un enlace mágico por correo electrónico a tu dirección de contacto para terminar de configurar tu espacio de trabajo y verificar tus datos.",
    backToOrgs: "Volver a organizaciones",
    howCertWorks: "Cómo funciona la certificación",
    becomePartner: "Conviértete en socio",
    intro:
      "Cuéntanos sobre tu organización. Cualquier organización sin fines de lucro 501(c)(3), agencia gubernamental, escuela pública o banco de alimentos puede ofrecer tareas cívicas y certificar horas. Crearemos tu espacio de trabajo de inmediato y te daremos seguimiento con un enlace mágico.",
    formError:
      "Algo no se ve bien en el formulario. Por favor revisa el nombre de la organización, el nombre de contacto y el correo electrónico, y vuelve a intentarlo.",
    orgName: "Nombre de la organización",
    optional: "(opcional)",
    yourName: "Tu nombre",
    contactEmail: "Correo electrónico de contacto",
    about: "Sobre tu organización",
    aboutPlaceholder: "Una o dos frases sobre lo que haces y el tipo de trabajo cívico que ofrecerías.",
    confirmEligible: "Al enviar este formulario confirmas que tu organización es elegible para certificar horas.",
    createWorkspace: "Crear espacio de trabajo",
    bullet1: "Tu espacio de trabajo se crea al instante.",
    bullet2: "Te damos seguimiento con un correo de enlace mágico para verificar tus datos.",
    bullet3: "No se requiere aprobación previa del estado para ofrecer tareas.",
  },
} as const;

export default async function OrgSignupPage({
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
                <MailCheck className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-5 text-[28px] font-semibold text-ink">{c.onListTitle}</h1>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-body">
                {c.onListBody}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild variant="secondary">
                  <Link href="/for-organizations">{c.backToOrgs}</Link>
                </Button>
                <Button asChild>
                  <Link href="/how-it-works#for-organizations">{c.howCertWorks} <ArrowRight /></Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                <Building2 className="size-6" strokeWidth={1.5} />
              </div>
              <h1 className="mt-4 text-[34px] font-semibold leading-tight text-ink">{c.becomePartner}</h1>
              <p className="mt-3 max-w-[560px] leading-relaxed text-body">
                {c.intro}
              </p>

              {error && (
                <div className="mt-6 rounded-lg border border-line bg-brick-subtle p-4">
                  <p className="text-sm font-medium text-brick">
                    {c.formError}
                  </p>
                </div>
              )}

              <form action={createOrgSignup} className="mt-8 space-y-5 rounded-lg border border-line bg-white p-6 md:p-8">
                <div className="space-y-1.5">
                  <Label htmlFor="name">{c.orgName}</Label>
                  <Input id="name" name="name" required placeholder="Community Tree Project" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="ein">EIN <span className="font-normal text-meta">{c.optional}</span></Label>
                    <Input id="ein" name="ein" placeholder="94-2698044" inputMode="numeric" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_name">{c.yourName}</Label>
                    <Input id="contact_name" name="contact_name" required placeholder="Daniel Okafor" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact_email">{c.contactEmail}</Label>
                  <Input id="contact_email" name="contact_email" type="email" required placeholder="you@yourorg.org" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="about">{c.about} <span className="font-normal text-meta">{c.optional}</span></Label>
                  <Textarea id="about" name="about" rows={4} placeholder={c.aboutPlaceholder} />
                </div>

                <div className="flex items-center justify-between gap-4 pt-1">
                  <p className="text-xs leading-relaxed text-meta">
                    {c.confirmEligible}
                  </p>
                  <Button type="submit">{c.createWorkspace} <ArrowRight /></Button>
                </div>
              </form>

              <ul className="mt-6 space-y-2 text-sm text-body">
                {[
                  c.bullet1,
                  c.bullet2,
                  c.bullet3,
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
