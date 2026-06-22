import Link from "next/link";
import {
  Trees,
  FileCheck2,
  ShieldCheck,
  Building2,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "How it works — Tended" };

const SECTIONS = {
  en: [
    { id: "civic-work", label: "Online volunteering" },
    { id: "calfresh", label: "SNAP & CF 888" },
    { id: "identity", label: "Identity & privacy" },
    { id: "for-organizations", label: "For organizations" },
  ],
  es: [
    { id: "civic-work", label: "Voluntariado en línea" },
    { id: "calfresh", label: "SNAP y el CF 888" },
    { id: "identity", label: "Identidad y privacidad" },
    { id: "for-organizations", label: "Para organizaciones" },
  ],
} as const;

const NEVER_USE = {
  en: [
    "ID.me or any third-party identity broker",
    "Facial recognition",
    "Selfie + photo-ID upload",
    "Social Security numbers",
    "Credit checks",
  ],
  es: [
    "ID.me ni ningún intermediario de identidad externo",
    "Reconocimiento facial",
    "Selfie + foto de identificación",
    "Números de Seguro Social",
    "Verificaciones de crédito",
  ],
} as const;

const TIERS = {
  en: [
    {
      title: "One verified account per person",
      body: "At signup you confirm an email and verify a phone number with a one-time code. Each person gets a single account, so logged hours always tie to one identified beneficiary and no one can farm multiple case numbers.",
    },
    {
      title: "Section 1 details",
      body: "Before your first task you enter the same information the CF 888 asks for — legal name, case number, address, date of birth.",
    },
    {
      title: "Benefits screenshot",
      body: "Before your first CF 888, a screenshot from your benefits account confirms you have an open SNAP case.",
    },
    {
      title: "Always-on signals",
      body: "Quiet checks in the background — device and location consistency, how fast work is submitted, and AI review for duplicate or low-effort content.",
    },
  ],
  es: [
    {
      title: "Una cuenta verificada por persona",
      body: "Al registrarte confirmas un correo y verificas un número de teléfono con un código de un solo uso. Cada persona tiene una sola cuenta, así las horas registradas siempre se vinculan a un beneficiario identificado y nadie puede acumular varios números de caso.",
    },
    {
      title: "Datos de la Sección 1",
      body: "Antes de tu primera tarea ingresas la misma información que pide el CF 888 — nombre legal, número de caso, dirección, fecha de nacimiento.",
    },
    {
      title: "Captura de pantalla de beneficios",
      body: "Antes de tu primer CF 888, una captura de pantalla de tu cuenta de beneficios confirma que tienes un caso de SNAP abierto.",
    },
    {
      title: "Señales siempre activas",
      body: "Comprobaciones discretas en segundo plano — consistencia del dispositivo y la ubicación, qué tan rápido se envía el trabajo, y revisión de IA para contenido duplicado o de poco esfuerzo.",
    },
  ],
} as const;

const COPY = {
  en: {
    overline: "How it works",
    title: "Real work, fairly counted.",
    intro: "Tended connects you with useful civic tasks posted by local nonprofits and agencies. You do the work, log your time, and a sponsoring organization reviews it. If you get SNAP (EBT), your approved hours can be certified toward your monthly work requirement.",
    onThisPage: "On this page",
    civicHeading: "Online volunteering",
    civicChecks: [
      "Every task has an outside beneficiary and gives its result away for free.",
      "Your active time is measured while you work, and credited up to a per-task cap.",
      "A real person reviews your work and credits your measured hours — never more.",
    ],
    snapHeading: "SNAP & the CF 888",
    section1Label: "Section 1",
    section1Rest: " is completed by you, the recipient — your name, case number, and the details of the activity.",
    section2Label: "Section 2",
    section2Rest: " is completed by the sponsoring nonprofit, which confirms the hours and signs.",
    identityHeading: "Identity & privacy",
    neverUseTitle: "We never use",
    orgHeading: "For organizations",
    becomePartner: "Become a partner",
    learnMore: "Learn more about hosting tasks",
  },
  es: {
    overline: "Cómo funciona",
    title: "Trabajo real, contado con justicia.",
    intro: "Tended te conecta con tareas cívicas útiles publicadas por organizaciones sin fines de lucro y agencias locales. Tú haces el trabajo, registras tu tiempo y una organización patrocinadora lo revisa. Si recibes SNAP (EBT), tus horas aprobadas pueden certificarse para tu requisito de trabajo mensual.",
    onThisPage: "En esta página",
    civicHeading: "Voluntariado en línea",
    civicChecks: [
      "Cada tarea tiene un beneficiario externo y entrega su resultado gratis.",
      "Tu tiempo activo se mide mientras trabajas, y se acredita hasta un límite por tarea.",
      "Una persona real revisa tu trabajo y acredita tus horas medidas — nunca más.",
    ],
    snapHeading: "SNAP y el CF 888",
    section1Label: "La Sección 1",
    section1Rest: " la completas tú, el beneficiario — tu nombre, número de caso y los detalles de la actividad.",
    section2Label: "La Sección 2",
    section2Rest: " la completa la organización sin fines de lucro patrocinadora, que confirma las horas y firma.",
    identityHeading: "Identidad y privacidad",
    neverUseTitle: "Nunca usamos",
    orgHeading: "Para organizaciones",
    becomePartner: "Conviértete en socio",
    learnMore: "Conoce más sobre ofrecer tareas",
  },
} as const;

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const sections = SECTIONS[locale];
  const tiers = TIERS[locale];
  const neverUse = NEVER_USE[locale];
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Header */}
        <section className="border-b border-line bg-white">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-6 md:py-16">
            <div className="max-w-[720px]">
              <p className="overline mb-4 text-teal">{c.overline}</p>
              <h1 className="service-heading text-[40px] leading-[1.1] md:text-[48px]">
                {c.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                {c.intro}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="grid gap-8 py-10 lg:grid-cols-[240px_1fr] md:py-14">
            {/* Anchor nav */}
            <nav aria-label="On this page" className="service-panel h-fit p-4 lg:sticky lg:top-20 lg:self-start">
              <p className="overline mb-3 text-teal">{c.onThisPage}</p>
              <ul className="space-y-1">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-teal-subtle hover:text-teal"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Content */}
            <div className="min-w-0 max-w-[760px] space-y-5">
              {/* Civic work */}
              <section id="civic-work" className="service-panel scroll-mt-24 p-6 md:p-8">
                <div className="flex size-12 items-center justify-center rounded-md bg-teal-subtle text-teal">
                  <Trees className="size-6" strokeWidth={1.5} />
                </div>
                <h2 className="service-heading mt-4 text-[28px]">{c.civicHeading}</h2>
                {locale === "es" ? (
                  <>
                    <p className="mt-3 leading-relaxed text-body">
                      Cada tarea en Tended es trabajo real que una organización local realmente
                      necesita, y cada tarea produce un <strong className="font-semibold text-ink">entregable
                      público gratuito</strong> que ayuda a alguien más que a ti — avisos traducidos
                      para vecinos que los necesitan, datos de peligros en las aceras enviados a Obras
                      Públicas, registros públicos transcritos entregados a una biblioteca. Nada de
                      esto es relleno, y nada se vende.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      Cada tarea se cronometra y se revisa. Registras tus horas a medida que avanzas,
                      luego envías tu trabajo. Una organización sin fines de lucro patrocinadora lo
                      revisa para verificar la calidad y acredita las horas que{" "}
                      <strong className="font-semibold text-ink">realmente trabajaste</strong> —
                      medidas por tu tiempo activo en la tarea, con un límite por tarea. Un revisor
                      puede reducir las horas por calidad, pero nunca acreditar más tiempo del que de
                      verdad dedicaste.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 leading-relaxed text-body">
                      Every task on Tended is real work that a local organization actually needs done,
                      and every task produces a <strong className="font-semibold text-ink">free public
                      deliverable</strong> that helps someone other than you — translated notices for
                      neighbors who need them, sidewalk-hazard data routed to Public Works, transcribed
                      public records given to a library. None of it is busywork, and none of it is sold.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      Each task is timed and reviewed. You log your hours as you go, then submit your
                      work. A sponsoring nonprofit reviews it for quality and credits the hours you{" "}
                      <strong className="font-semibold text-ink">actually worked</strong> — measured by
                      your active time on the task, capped per task. A reviewer can lower hours for
                      quality, but never credit more time than you truly put in.
                    </p>
                  </>
                )}
                <ul className="mt-5 space-y-2">
                  {c.civicChecks.map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-body">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" strokeWidth={1.5} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* SNAP */}
              <section id="calfresh" className="service-panel scroll-mt-24 p-6 md:p-8">
                <div className="flex size-12 items-center justify-center rounded-md bg-teal-subtle text-teal">
                  <FileCheck2 className="size-6" strokeWidth={1.5} />
                </div>
                <h2 className="service-heading mt-4 text-[28px]">{c.snapHeading}</h2>
                {locale === "es" ? (
                  <>
                    <p className="mt-3 leading-relaxed text-body">
                      Cambios recientes ampliaron las reglas de trabajo que se aplican a muchos adultos
                      que reciben SNAP — conocido en California como CalFresh — y California comienza a
                      aplicarlas el{" "}
                      <strong className="font-semibold text-ink">1 de junio de 2026</strong>. Las horas
                      de voluntariado no remunerado cuentan para ese requisito según la norma federal{" "}
                      <strong className="font-semibold text-ink">7 CFR §273.24(a)(2)(iii)</strong>,
                      implementada en California por CDSS (ACL 25-34). Hacer voluntariado a través de una
                      organización sin fines de lucro patrocinadora — en persona o, con Tended, en línea —
                      es una manera de cumplir las horas.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      California verifica esas horas con un formulario llamado{" "}
                      <strong className="font-semibold text-ink">CF 888</strong>. Tiene dos partes:
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 leading-relaxed text-body">
                      Recent changes expanded the work rules that apply to many adults who receive SNAP —
                      known in California as CalFresh — and California begins enforcing them on{" "}
                      <strong className="font-semibold text-ink">June 1, 2026</strong>. Unpaid volunteer
                      hours count toward that requirement under federal rule{" "}
                      <strong className="font-semibold text-ink">7 CFR §273.24(a)(2)(iii)</strong>, as
                      implemented in California by CDSS (ACL 25-34). Volunteering through a sponsoring
                      nonprofit — in person or, with Tended, remotely — is one way to meet the hours.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      California verifies those hours with a form called the{" "}
                      <strong className="font-semibold text-ink">CF 888</strong>. It has two parts:
                    </p>
                  </>
                )}
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2.5 text-body">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-subtle text-xs font-semibold text-forest">1</span>
                    <span><strong className="font-semibold text-ink">{c.section1Label}</strong>{c.section1Rest}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-body">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-subtle text-xs font-semibold text-forest">2</span>
                    <span><strong className="font-semibold text-ink">{c.section2Label}</strong>{c.section2Rest}</span>
                  </li>
                </ul>
                {locale === "es" ? (
                  <>
                    <p className="mt-4 leading-relaxed text-body">
                      Cuando tus horas se aprueban, Tended genera un CF 888 pre-llenado con ambas
                      secciones ya tomadas de tu cuenta y de la certificación de la organización. Tú lo
                      descargas y lo subes tú mismo a tu portal de beneficios.
                    </p>
                    <div className="mt-5 rounded-lg border border-line bg-amber-subtle p-4">
                      <p className="text-sm leading-relaxed text-amber">
                        <strong className="font-semibold">Tended nunca envía nada al estado.</strong>{" "}
                        Tú mantienes el control: tú mismo subes tu CF 888 a tu portal de beneficios, igual
                        que manejas el resto de tu caso.
                      </p>
                    </div>
                    <div className="mt-3 rounded-lg border border-line bg-forest-subtle p-4">
                      <p className="text-sm leading-relaxed text-forest">
                        <strong className="font-semibold">Eres voluntario.</strong> Tended no te paga
                        nada — ni salarios, ni estipendios, ni nada de valor — y tu trabajo nunca
                        desplaza a personal remunerado. El único beneficio es la elegibilidad
                        independiente para SNAP.{" "}
                        <strong className="font-semibold">Tended registra tus horas; el Condado decide
                        la elegibilidad.</strong>
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-4 leading-relaxed text-body">
                      When your hours are approved, Tended generates a pre-filled CF 888 with both
                      sections already drawn from your account and the organization&apos;s certification.
                      You download it and upload it to your benefits portal yourself.
                    </p>
                    <div className="mt-5 rounded-lg border border-line bg-amber-subtle p-4">
                      <p className="text-sm leading-relaxed text-amber">
                        <strong className="font-semibold">Tended never submits anything to the state.</strong>{" "}
                        You stay in control: you upload your own CF 888 to your benefits portal, the same way you
                        handle the rest of your case.
                      </p>
                    </div>
                    <div className="mt-3 rounded-lg border border-line bg-forest-subtle p-4">
                      <p className="text-sm leading-relaxed text-forest">
                        <strong className="font-semibold">You&apos;re a volunteer.</strong> Tended pays you
                        nothing — no wages, stipends, or anything of value — and your work never displaces
                        paid staff. The only benefit is independent SNAP eligibility.{" "}
                        <strong className="font-semibold">Tended records your hours; the County decides
                        eligibility.</strong>
                      </p>
                    </div>
                  </>
                )}
              </section>

              {/* Identity & privacy */}
              <section id="identity" className="service-panel scroll-mt-24 p-6 md:p-8">
                <div className="flex size-12 items-center justify-center rounded-md bg-teal-subtle text-teal">
                  <ShieldCheck className="size-6" strokeWidth={1.5} />
                </div>
                <h2 className="service-heading mt-4 text-[28px]">{c.identityHeading}</h2>
                {locale === "es" ? (
                  <>
                    <p className="mt-3 leading-relaxed text-body">
                      El estado ya verificó a todos los inscritos en SNAP. Nuestro trabajo no es volver
                      a demostrar quién eres — es mantener tu cuenta consistente y capturar los datos de
                      la Sección 1 con precisión. El número de caso del CF 888 es el puente con tu
                      identidad; no necesitamos reconstruirla desde cero.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      Por eso, la verificación en Tended es ligera y por capas. Agregamos apenas la
                      confianza necesaria en cada paso para mantener el programa confiable, sin
                      verificaciones de identidad invasivas:
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 leading-relaxed text-body">
                      The state already verified everyone enrolled in SNAP. Our job is not to
                      re-prove who you are — it is to keep your account consistent and capture the
                      Section 1 details accurately. The CF 888 case number is the bridge to your
                      identity; we don&apos;t need to rebuild it from scratch.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      Because of that, verification on Tended is light and layered. We add just enough
                      confidence at each step to keep the program trustworthy, without invasive
                      identity checks:
                    </p>
                  </>
                )}
                <ol className="mt-5 space-y-3">
                  {tiers.map((t, i) => (
                    <li key={t.title} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white">{i + 1}</span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{t.title}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-body">{t.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 rounded-lg border border-line bg-brick-subtle p-5">
                  <p className="text-sm font-semibold text-brick">{c.neverUseTitle}</p>
                  <ul className="mt-3 space-y-2">
                    {neverUse.map((n) => (
                      <li key={n} className="flex items-start gap-2.5 text-sm text-body">
                        <XCircle className="mt-0.5 size-4 shrink-0 text-brick" strokeWidth={1.5} />
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* For organizations */}
              <section id="for-organizations" className="service-panel scroll-mt-24 p-6 md:p-8">
                <div className="flex size-12 items-center justify-center rounded-md bg-teal-subtle text-teal">
                  <Building2 className="size-6" strokeWidth={1.5} />
                </div>
                <h2 className="service-heading mt-4 text-[28px]">{c.orgHeading}</h2>
                {locale === "es" ? (
                  <>
                    <p className="mt-3 leading-relaxed text-body">
                      Cualquier organización sin fines de lucro 501(c)(3), agencia gubernamental,
                      escuela pública o banco de alimentos puede patrocinar trabajo cívico en Tended. No
                      hay una lista de aprobación previa del estado a la que entrar — si eres una de
                      estas organizaciones, puedes ofrecer tareas y certificar horas para las personas a
                      las que sirves.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      Cada tarea que publiques debe pasar un filtro simple: un beneficiario real más
                      allá del voluntario, una necesidad genuina que tengas, un entregable que se regale
                      gratis, y trabajo que un voluntario haría de todos modos. Los voluntarios
                      complementan tu misión — no desplazan a personal remunerado.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      Los patrocinadores publican tareas, revisan los envíos para verificar la calidad y
                      acreditan las horas que el voluntario realmente trabajó (puedes reducirlas, nunca
                      aumentarlas por encima del tiempo medido). Cuando las horas se aprueban, tu
                      certificación de la Sección 2 es lo que hace válido el CF 888.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-3 leading-relaxed text-body">
                      Any 501(c)(3) nonprofit, government agency, public school, or food bank can sponsor
                      civic work on Tended. There is no state pre-approval list to get onto — if you are
                      one of these organizations, you can host tasks and certify hours for the people you
                      serve.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      Every task you post must clear a simple gate: a real beneficiary beyond the
                      volunteer, a genuine need you have, a deliverable given away for free, and work a
                      volunteer would do anyway. Volunteers supplement your mission — they don&apos;t
                      displace paid staff.
                    </p>
                    <p className="mt-3 leading-relaxed text-body">
                      Sponsors post tasks, review submissions for quality, and credit the hours the
                      volunteer actually worked (you can lower them, never raise them above measured
                      time). When hours are approved, your Section 2 certification is what makes the
                      CF 888 valid.
                    </p>
                  </>
                )}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <Link href="/org/signup">{c.becomePartner} <ArrowRight /></Link>
                  </Button>
                  <Button asChild variant="tertiary">
                    <Link href="/for-organizations">{c.learnMore}</Link>
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
