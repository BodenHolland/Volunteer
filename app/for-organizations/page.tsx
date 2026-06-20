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
import { PilotBanner } from "@/components/pilot-banner";
import { Button } from "@/components/ui/button";

export const metadata = { title: "For organizations — Tended" };

const STEPS = [
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
    body: "When you approve a submission, the credited hours are recorded. For recipients certifying CalFresh, your approval becomes Section 2 of their CF 888 — the certification that makes it valid.",
  },
];

const ELIGIBLE = [
  { icon: Building2, label: "501(c)(3) nonprofits" },
  { icon: Landmark, label: "Government agencies" },
  { icon: GraduationCap, label: "Public schools" },
  { icon: Apple, label: "Food banks" },
];

export default function ForOrganizationsPage() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <PilotBanner />
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="max-w-[720px]">
              <p className="overline mb-4">For organizations</p>
              <h1 className="text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">
                Put your work in front of neighbors who want to do it.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Sponsor civic tasks, review the work that comes back, and certify volunteer hours
                for the people you serve. For recipients meeting the new CalFresh work requirement,
                your certification is the final piece.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/org/signup">Become a partner <ArrowRight /></Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/how-it-works#for-organizations">How certification works</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-[720px]">
            <h2 className="text-[28px] font-semibold text-ink">Three things you do</h2>
            <p className="mt-2 leading-relaxed text-body">
              Hosting on Tended is simple, and you stay in control of the work and the hours.
            </p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="flex size-12 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <s.icon className="size-6" strokeWidth={1.5} />
                </div>
                <p className="overline mt-4">Step {i + 1}</p>
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
                <h2 className="text-[28px] font-semibold text-ink">Who can sponsor</h2>
                <p className="mt-3 leading-relaxed text-body">
                  There is no state pre-approval list to get onto. If your organization is one of
                  these, you can host tasks and certify hours:
                </p>
                <ul className="mt-5 space-y-2.5">
                  {ELIGIBLE.map((e) => (
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
                <h3 className="text-lg font-semibold text-ink">What you get</h3>
                <ul className="mt-4 space-y-3">
                  {[
                    "A queue of reviewed civic work, with AI flags surfaced for you.",
                    "Real results from the field — data, translations, write-ups you can use.",
                    "A simple way to certify CalFresh hours without touching the state system yourself.",
                    "More volunteers reached, with less stigma than benefit-first framing.",
                  ].map((t) => (
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
            <h2 className="text-[22px] font-semibold text-ink">Ready to host civic work?</h2>
            <p className="mt-1 text-body">Tell us about your organization — it takes a minute.</p>
          </div>
          <Button asChild size="lg">
            <Link href="/org/signup">Become a partner <ArrowRight /></Link>
          </Button>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
