import Link from "next/link";
import { ArrowRight, Heart, Users, Sprout } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "About — Tended" };

const VALUES = {
  en: [
    {
      icon: Sprout,
      title: "Work first, paperwork second",
      body: "Tended is built around real volunteer work for nonprofits and public agencies. SNAP certification is one supported path through it, not the headline. That framing widens who feels welcome and takes the stigma out of showing up.",
    },
    {
      icon: Users,
      title: "Built with, not for",
      body: "We design this alongside the nonprofits and public agencies that use the results. Their tasks, their review, their certification.",
    },
    {
      icon: Heart,
      title: "Honest about what's real",
      body: "We're upfront about how the program works and what counts. Hours reflect the time you actually put in — never inflated — and we don't overpromise what certification can do.",
    },
  ],
  es: [
    {
      icon: Sprout,
      title: "Primero el trabajo, después el papeleo",
      body: "Tended se basa en trabajo voluntario real para organizaciones sin fines de lucro y agencias públicas. La certificación de SNAP es uno de los caminos que apoya, no el titular. Ese enfoque amplía quién se siente bienvenido y le quita el estigma a participar.",
    },
    {
      icon: Users,
      title: "Construido con la gente, no solo para ella",
      body: "Lo diseñamos junto a las organizaciones sin fines de lucro y agencias públicas que usan los resultados. Sus tareas, su revisión, su certificación.",
    },
    {
      icon: Heart,
      title: "Honestos sobre lo que es real",
      body: "Somos claros sobre cómo funciona el programa y qué cuenta. Las horas reflejan el tiempo que realmente dedicas — nunca infladas — y no prometemos de más sobre lo que la certificación puede hacer.",
    },
  ],
} as const;

const COPY = {
  en: {
    overline: "About Tended",
    title: "A calmer way to meet a hard new requirement.",
    intro: "Starting June 1, 2026, California enforces an expanded work requirement for many adults who get SNAP (EBT). Tended helps people meet it through real volunteer work — and helps the nonprofits already doing that work bring more people in.",
    whyTitle: "Why we built it",
    why1: "When the new requirement was announced, the people most affected were also the ones with the least margin to navigate another bureaucratic hurdle. The official path — find an approved activity, log the hours, get a CF 888 signed, upload it to your benefits portal — is doable, but it is easy to get lost in. We wanted something that felt less like a compliance task and more like doing something useful.",
    why2: "So we started with the work. Counting trees, translating notices, mapping hazards, documenting the places people gather. This is work nonprofits genuinely need, and it is work that anyone can be proud of. SNAP certification rides along for the people who need it, but the door is open to volunteers and neighbors of every kind. That is deliberate: a platform centered on civic work reaches a wider audience and carries far less stigma than one labeled by who qualifies for which benefit.",
    howTitle: "How it’s being built",
    how1: "Tended is shaped alongside the nonprofits and public agencies that use the results. The tasks come from organizations that will actually use them. The review and the hours certification are done by those same organizations. We are not standing between recipients and the state — we generate a pre-filled CF 888 and hand it back to the recipient to upload themselves.",
    seeHow: "See how it works",
    forOrgs: "For organizations",
  },
  es: {
    overline: "Acerca de Tended",
    title: "Una forma más tranquila de cumplir un nuevo requisito difícil.",
    intro: "A partir del 1 de junio de 2026, California aplica un requisito de trabajo ampliado para muchos adultos que reciben SNAP (EBT). Tended ayuda a las personas a cumplirlo mediante trabajo voluntario real — y ayuda a las organizaciones sin fines de lucro que ya hacen ese trabajo a sumar a más gente.",
    whyTitle: "Por qué lo creamos",
    why1: "Cuando se anunció el nuevo requisito, las personas más afectadas también eran las que tenían menos margen para sortear otro obstáculo burocrático. El camino oficial — encontrar una actividad aprobada, registrar las horas, conseguir un CF 888 firmado, subirlo a tu portal de beneficios — es posible, pero es fácil perderse en él. Queríamos algo que se sintiera menos como un trámite de cumplimiento y más como hacer algo útil.",
    why2: "Así que empezamos por el trabajo. Contar árboles, traducir avisos, mapear peligros, documentar los lugares donde la gente se reúne. Es trabajo que las organizaciones sin fines de lucro realmente necesitan, y es trabajo del que cualquiera puede sentirse orgulloso. La certificación de SNAP acompaña a quienes la necesitan, pero la puerta está abierta a voluntarios y vecinos de todo tipo. Eso es intencional: una plataforma centrada en el trabajo cívico llega a un público más amplio y carga mucho menos estigma que una etiquetada por quién califica para cuál beneficio.",
    howTitle: "Cómo se está construyendo",
    how1: "Tended se diseña junto a las organizaciones sin fines de lucro y agencias públicas que usan los resultados. Las tareas vienen de organizaciones que de verdad las usarán. La revisión y la certificación de horas las hacen esas mismas organizaciones. No nos interponemos entre los beneficiarios y el estado — generamos un CF 888 pre-llenado y se lo devolvemos al beneficiario para que lo suba él mismo.",
    seeHow: "Mira cómo funciona",
    forOrgs: "Para organizaciones",
  },
} as const;

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const locale = await getLocale();
  const c = COPY[locale];
  const values = VALUES[locale];
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="max-w-[720px]">
              <p className="overline mb-4">{c.overline}</p>
              <h1 className="text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">
                {c.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                {c.intro}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[720px] px-4 py-16 md:px-6 md:py-20">
          <div className="space-y-4">
            <h2 className="text-[26px] font-semibold text-ink">{c.whyTitle}</h2>
            <p className="leading-relaxed text-body">
              {c.why1}
            </p>
            <p className="leading-relaxed text-body">
              {c.why2}
            </p>

            <h2 className="mt-10 text-[26px] font-semibold text-ink">{c.howTitle}</h2>
            <p className="leading-relaxed text-body">
              {c.how1}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-lg border border-line bg-white p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <v.icon className="size-5" strokeWidth={1.5} />
                </div>
                <h3 className="mt-3 text-base font-semibold text-ink">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{v.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/how-it-works">{c.seeHow} <ArrowRight /></Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/for-organizations">{c.forOrgs}</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
