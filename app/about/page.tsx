import Link from "next/link";
import { ArrowRight, Heart, Users, Sprout } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { getDict } from "@/lib/i18n";

export const metadata = { title: "About — colift" };

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const { t } = await getDict();
  const values = [
    { icon: Sprout, title: t.about.value0Title, body: t.about.value0Body },
    { icon: Users,  title: t.about.value1Title, body: t.about.value1Body },
    { icon: Heart,  title: t.about.value2Title, body: t.about.value2Body },
  ];

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* ─── HERO (white, default canvas) ─────────────────────────── */}
        <section className="border-b border-civic-line bg-white">
          <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-24">
            <div className="max-w-[760px]">
              <h1 className="text-[40px] font-semibold leading-[1.06] tracking-tight text-ink md:text-[56px]">
                {t.about.title}
              </h1>
              <p className="mt-6 max-w-[640px] text-[18px] leading-relaxed text-body">
                {t.about.intro}
              </p>
            </div>
          </div>
        </section>

        {/* ─── WHY (Community Lilac — story / motivation mode) ──────── */}
        <section className="mode-community border-b border-civic-line">
          <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-24">
            <div className="grid gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-4">
                <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-ink md:text-[34px]">
                  {t.about.whyTitle}
                </h2>
              </div>
              <div className="md:col-span-8 space-y-5 text-[17px] leading-relaxed text-body">
                <p>{t.about.why1}</p>
                <p>{t.about.why2}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── HOW (white — methodical, operational) ────────────────── */}
        <section className="border-b border-civic-line bg-white">
          <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-24">
            <div className="grid gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-4">
                <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-ink md:text-[34px]">
                  {t.about.howTitle}
                </h2>
              </div>
              <div className="md:col-span-8 text-[17px] leading-relaxed text-body">
                <p>{t.about.how1}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── VALUES (Verification Sage — principles / trust) ──────── */}
        <section className="mode-verify border-b border-civic-line">
          <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-24">
            <h2 className="text-[28px] font-semibold leading-tight tracking-tight text-ink md:text-[34px]">
              How we work
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {values.map((v) => (
                <div key={v.title} className="rounded-lg border border-civic-line bg-white p-6">
                  <div className="flex size-10 items-center justify-center rounded-md bg-field-green-soft text-field-green">
                    <v.icon className="size-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="mt-4 text-[17px] font-semibold text-ink">{v.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-body">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}
