import Link from "next/link";
import { ArrowRight, Heart, Users, Sprout, Info } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

export const metadata = { title: "About — Tended" };

const VALUES = [
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
    body: "This is a demonstration. Some pieces are live and some are still mocked. We say which is which, and we don't pretend the program is something it isn't yet.",
  },
];

export const dynamic = "force-dynamic";

export default function AboutPage() {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <section className="bg-section">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-6 md:py-20">
            <div className="max-w-[720px]">
              <p className="overline mb-4">About Tended</p>
              <h1 className="text-[40px] font-semibold leading-[1.1] text-ink md:text-[48px]">
                A calmer way to meet a hard new requirement.
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-body">
                Starting June 1, 2026, California enforces an expanded work requirement for many
                adults who get SNAP (EBT). Tended helps people meet it through real volunteer
                work — and helps the nonprofits already doing that work bring more people in.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[720px] px-4 py-16 md:px-6 md:py-20">
          <div className="space-y-4">
            <h2 className="text-[26px] font-semibold text-ink">Why we built it</h2>
            <p className="leading-relaxed text-body">
              When the new requirement was announced, the people most affected were also the ones
              with the least margin to navigate another bureaucratic hurdle. The official path —
              find an approved activity, log the hours, get a CF 888 signed, upload it to
              your benefits portal — is doable, but it is easy to get lost in. We wanted something that felt
              less like a compliance task and more like doing something useful.
            </p>
            <p className="leading-relaxed text-body">
              So we started with the work. Counting trees, translating notices, mapping hazards,
              documenting the places people gather. This is work nonprofits genuinely need, and it
              is work that anyone can be proud of. SNAP certification rides along for the people
              who need it, but the door is open to volunteers and neighbors of every kind. That is
              deliberate: a platform centered on civic work reaches a wider audience and carries far
              less stigma than one labeled by who qualifies for which benefit.
            </p>

            <h2 className="mt-10 text-[26px] font-semibold text-ink">How it&apos;s being built</h2>
            <p className="leading-relaxed text-body">
              Tended is shaped alongside the nonprofits and public agencies that use the results. The
              tasks come from organizations that will actually use them. The review and the
              hours certification are done by those same organizations. We are not standing between
              recipients and the state — we generate a pre-filled CF 888 and hand it back to the
              recipient to upload themselves.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-lg border border-line bg-white p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-forest-subtle text-forest">
                  <v.icon className="size-5" strokeWidth={1.5} />
                </div>
                <h3 className="mt-3 text-base font-semibold text-ink">{v.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-body">{v.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-lg border border-line bg-amber-subtle p-5">
            <p className="flex items-start gap-2 text-sm font-semibold text-amber">
              <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} /> This is a demo
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber">
              Tended is an unlisted demonstration. It is not affiliated with the State of California.
              Hours shown here are not yet recognized by any agency, no real accounts exist, and
              nothing is submitted to the state. The
              organizations and partnerships shown are illustrative — they help us tell the story
              while we build the real thing.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link href="/how-it-works">See how it works <ArrowRight /></Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/for-organizations">For organizations</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
