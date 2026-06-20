import Link from "next/link";
import {
  Trees,
  FileCheck2,
  ShieldCheck,
  Building2,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PilotBanner } from "@/components/pilot-banner";
import { Button } from "@/components/ui/button";

export const metadata = { title: "How it works — Tended" };

const SECTIONS = [
  { id: "civic-work", label: "Civic work" },
  { id: "calfresh", label: "CalFresh & CF 888" },
  { id: "identity", label: "Identity & privacy" },
  { id: "for-organizations", label: "For organizations" },
];

const NEVER_USE = [
  "ID.me or any third-party identity broker",
  "Facial recognition",
  "Selfie + photo-ID upload",
  "Social Security numbers",
  "Credit checks",
];

const TIERS = [
  {
    title: "One verified account per person",
    body: "At signup you confirm an email and verify a phone number with a one-time code. Each person gets a single account, so logged hours always tie to one identified beneficiary and no one can farm multiple case numbers.",
  },
  {
    title: "Section 1 details",
    body: "Before your first task you enter the same information the CF 888 asks for — legal name, case number, address, date of birth.",
  },
  {
    title: "BenefitsCal screenshot",
    body: "Before your first CF 888, a screenshot from your BenefitsCal account confirms you have an open CalFresh case.",
  },
  {
    title: "Always-on signals",
    body: "Quiet checks in the background — device and location consistency, how fast work is submitted, and AI review for duplicate or low-effort content.",
  },
];

export const dynamic = "force-dynamic";

export default function HowItWorksPage() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Header */}
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="max-w-[720px]">
              <p className="overline mb-4">How it works</p>
              <h1 className="text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">
                Real work, fairly counted.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Tended connects you with useful civic tasks posted by local nonprofits and
                agencies. You do the work, log your time, and a sponsoring organization reviews it.
                If you receive CalFresh, your approved hours can be certified toward your monthly
                work requirement.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1200px] px-4 md:px-6">
          <div className="grid gap-12 py-16 lg:grid-cols-[220px_1fr] md:py-20">
            {/* Anchor nav */}
            <nav aria-label="On this page" className="lg:sticky lg:top-20 lg:self-start">
              <p className="overline mb-3">On this page</p>
              <ul className="space-y-1">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section hover:text-forest"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Content */}
            <div className="min-w-0 max-w-[720px] space-y-16">
              {/* Civic work */}
              <section id="civic-work" className="scroll-mt-24">
                <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <Trees className="size-6" strokeWidth={1.5} />
                </div>
                <h2 className="mt-4 text-[28px] font-semibold text-ink">Civic work</h2>
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
                <ul className="mt-5 space-y-2">
                  {[
                    "Every task has an outside beneficiary and gives its result away for free.",
                    "Your active time is measured while you work, and credited up to a per-task cap.",
                    "A real person reviews your work and credits your measured hours — never more.",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2.5 text-body">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-forest" strokeWidth={1.5} />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* CalFresh */}
              <section id="calfresh" className="scroll-mt-24">
                <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <FileCheck2 className="size-6" strokeWidth={1.5} />
                </div>
                <h2 className="mt-4 text-[28px] font-semibold text-ink">CalFresh & the CF 888</h2>
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
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start gap-2.5 text-body">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-subtle text-xs font-semibold text-forest">1</span>
                    <span><strong className="font-semibold text-ink">Section 1</strong> is completed by you, the recipient — your name, case number, and the details of the activity.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-body">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-forest-subtle text-xs font-semibold text-forest">2</span>
                    <span><strong className="font-semibold text-ink">Section 2</strong> is completed by the sponsoring nonprofit, which confirms the hours and signs.</span>
                  </li>
                </ul>
                <p className="mt-4 leading-relaxed text-body">
                  When your hours are approved, Tended generates a pre-filled CF 888 with both
                  sections already drawn from your account and the organization&apos;s certification.
                  You download it and upload it to BenefitsCal yourself.
                </p>
                <div className="mt-5 rounded-lg border border-line bg-amber-subtle p-4">
                  <p className="text-sm leading-relaxed text-amber">
                    <strong className="font-semibold">Tended never submits anything to the state.</strong>{" "}
                    You stay in control: you upload your own CF 888 to BenefitsCal, the same way you
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
              </section>

              {/* Identity & privacy */}
              <section id="identity" className="scroll-mt-24">
                <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <ShieldCheck className="size-6" strokeWidth={1.5} />
                </div>
                <h2 className="mt-4 text-[28px] font-semibold text-ink">Identity & privacy</h2>
                <p className="mt-3 leading-relaxed text-body">
                  The state already verified everyone enrolled in CalFresh. Our job is not to
                  re-prove who you are — it is to keep your account consistent and capture the
                  Section 1 details accurately. The CF 888 case number is the bridge to your
                  identity; we don&apos;t need to rebuild it from scratch.
                </p>
                <p className="mt-3 leading-relaxed text-body">
                  Because of that, verification on Tended is light and layered. We add just enough
                  confidence at each step to keep the program trustworthy, without invasive
                  identity checks:
                </p>
                <ol className="mt-5 space-y-3">
                  {TIERS.map((t, i) => (
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
                  <p className="text-sm font-semibold text-brick">We never use</p>
                  <ul className="mt-3 space-y-2">
                    {NEVER_USE.map((n) => (
                      <li key={n} className="flex items-start gap-2.5 text-sm text-body">
                        <XCircle className="mt-0.5 size-4 shrink-0 text-brick" strokeWidth={1.5} />
                        <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* For organizations */}
              <section id="for-organizations" className="scroll-mt-24">
                <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <Building2 className="size-6" strokeWidth={1.5} />
                </div>
                <h2 className="mt-4 text-[28px] font-semibold text-ink">For organizations</h2>
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
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <Link href="/org/signup">Become a partner <ArrowRight /></Link>
                  </Button>
                  <Button asChild variant="tertiary">
                    <Link href="/for-organizations">Learn more about hosting tasks</Link>
                  </Button>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-meta">
                  <Clock className="size-3.5" strokeWidth={1.5} /> Pilot demo — partnerships shown across Tended are illustrative.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
