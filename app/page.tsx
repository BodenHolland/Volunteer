import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Landmark,
  Languages,
  MapPin,
  ShieldCheck,
  Sprout,
  TreeDeciduous,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { ListingCard, type ListingCardData } from "@/components/listing-card";
import { listActiveTasks } from "@/lib/queries";
import { getDict } from "@/lib/i18n";

export const metadata = {
  title: "colift — Civic work that counts",
};

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const { t } = await getDict();
  const featuredTasks = (await listActiveTasks()).slice(0, 4);
  const featuredCards: ListingCardData[] = featuredTasks.map((task, i) => ({
    id: task.id,
    href: `/opportunities/${task.id}`,
    title: task.title,
    orgName: task.org.name,
    orgSlug: task.org.slug,
    category: task.category,
    location: task.location_kind,
    createdAt: task.created_at,
    featured: i === 0,
  }));

  return (
    <>
      <a href="#main" className="skip-link">{t.landing.skipToContent}</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* ─── HERO ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-white">
          <div className="mx-auto max-w-[1280px] px-5 pb-20 pt-14 md:px-8 md:pb-28 md:pt-20">
            <div className="grid gap-10 md:grid-cols-12 md:gap-12">
              <div className="md:col-span-7 md:pt-6">
                <h1 className="text-[40px] font-semibold leading-[1.04] tracking-tight text-ink md:text-[68px] md:leading-[1.02]">
                  {t.landing.heroTitle1}
                  <br />
                  <span className="text-civic-blue">{t.landing.heroTitle2}</span>
                </h1>
                <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-body md:text-lg">
                  {t.landing.heroParagraph}
                </p>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/opportunities">{t.landing.heroCta} <ArrowRight /></Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/how-it-works">{t.landing.heroCtaSecondary}</Link>
                  </Button>
                </div>
                <p className="mt-7 inline-flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-field-green" strokeWidth={2} aria-hidden />
                    {t.landing.trustFree}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-field-green" strokeWidth={2} aria-hidden />
                    {t.landing.trustOpenData}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="size-4 text-field-green" strokeWidth={2} aria-hidden />
                    {t.landing.trustSnap}
                  </span>
                </p>
              </div>

              <div className="md:col-span-5 md:pt-2">
                <HeroBoard t={t.landing} />
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-px bg-civic-line" />
        </section>

        {/* ─── TASK DISCOVERY (Task Sky) ─────────────────────────────── */}
        {featuredCards.length > 0 && (
          <section className="mode-task border-b border-civic-line">
            <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-24">
              <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-ink md:text-[42px]">
                {t.landing.taskSectionTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-body">
                {t.landing.taskSectionParagraph}
              </p>

              <div className="mt-10">
                {featuredCards.map((c) => (
                  <ListingCard key={c.id} task={c} />
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <Button asChild variant="secondary">
                  <Link href="/opportunities">{t.landing.taskSectionCta} <ArrowRight /></Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ─── COMMUNITY OUTCOMES (Paper, editorial) ─────────────────── */}
        <section className="border-b border-civic-line bg-white">
          <div className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-32">
            <div className="grid gap-10 md:grid-cols-12 md:gap-16">
              <div className="md:col-span-5">
                <h2 className="text-[34px] font-semibold leading-[1.08] tracking-tight text-ink md:text-[48px]">
                  {t.landing.publicGoodTitle}
                </h2>
                <p className="mt-5 text-[17px] leading-relaxed text-body">
                  {t.landing.publicGoodParagraph}
                </p>
              </div>

              <div className="md:col-span-7">
                <div className="grid gap-4 sm:grid-cols-2">
                  <OutcomeCard
                    tint="mode-community"
                    Icon={TreeDeciduous}
                    label={t.landing.outcomeFieldDataLabel}
                    title={t.landing.outcomeFieldDataTitle}
                    body={t.landing.outcomeFieldDataBody}
                  />
                  <OutcomeCard
                    tint="mode-partner"
                    Icon={Languages}
                    label={t.landing.outcomeTranslationLabel}
                    title={t.landing.outcomeTranslationTitle}
                    body={t.landing.outcomeTranslationBody}
                  />
                  <OutcomeCard
                    tint="mode-notice"
                    Icon={MapPin}
                    label={t.landing.outcomeWritingLabel}
                    title={t.landing.outcomeWritingTitle}
                    body={t.landing.outcomeWritingBody}
                  />
                  <OutcomeCard
                    tint="mode-verify"
                    Icon={ClipboardList}
                    label={t.landing.outcomeAuditLabel}
                    title={t.landing.outcomeAuditTitle}
                    body={t.landing.outcomeAuditBody}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── VERIFICATION (Sage — SNAP/EBT generic) ─────────────────── */}
        <section className="mode-verify border-b border-civic-line">
          <div className="mx-auto max-w-[1280px] px-5 py-20 md:px-8 md:py-24">
            <div className="grid gap-10 md:grid-cols-12 md:gap-12">
              <div className="md:col-span-5">
                <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-ink md:text-[40px]">
                  {t.landing.verifyTitle}
                </h2>
                <p className="mt-5 text-[17px] leading-relaxed text-body">
                  {t.landing.verifyParagraph}
                </p>
                <ul className="mt-7 space-y-3 text-[15px] text-ink">
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-field-green" strokeWidth={1.75} aria-hidden />
                    <span>{t.landing.verifyBullet0}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-field-green" strokeWidth={1.75} aria-hidden />
                    <span>{t.landing.verifyBullet1}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-field-green" strokeWidth={1.75} aria-hidden />
                    <span>{t.landing.verifyBullet2}</span>
                  </li>
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild variant="accent">
                    <Link href="/how-it-works">{t.landing.verifyCtaPrimary} <ArrowRight /></Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/data/hours-calculator">{t.landing.verifyCtaSecondary}</Link>
                  </Button>
                </div>
              </div>

              <div className="md:col-span-7">
                <CertPreview t={t.landing} />
              </div>
            </div>
          </div>
        </section>

        {/* ─── PARTNER / ORGS ────────────────────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto max-w-[1280px] px-5 py-24 md:px-8 md:py-28">
            <div className="grid gap-10 md:grid-cols-12 md:gap-12">
              <div className="md:col-span-7">
                <h2 className="text-[32px] font-semibold leading-tight tracking-tight text-ink md:text-[44px]">
                  {t.landing.partnerTitle}
                </h2>
                <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-body">
                  {t.landing.partnerParagraph}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" variant="primary">
                    <Link href="/for-organizations">{t.landing.partnerCtaPrimary} <ArrowRight /></Link>
                  </Button>
                  <Link
                    href="/how-it-works"
                    className="inline-flex items-center gap-1 self-center text-sm font-medium text-slate hover:text-ink"
                  >
                    {t.landing.partnerCtaSecondary} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>

              <div className="md:col-span-5">
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-1">
                  <PartnerRow Icon={Landmark} title={t.landing.partnerRow0Title} sub={t.landing.partnerRow0Sub} />
                  <PartnerRow Icon={Sprout} title={t.landing.partnerRow1Title} sub={t.landing.partnerRow1Sub} />
                  <PartnerRow Icon={FileCheck2} title={t.landing.partnerRow2Title} sub={t.landing.partnerRow2Sub} />
                </ul>
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </>
  );
}

/* ───── Hero visual ──────────────────────────────────────────────── */
function HeroBoard({ t }: { t: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any }) {
  return (
    <div className="relative mx-auto aspect-[5/6] w-full max-w-[440px]">
      <div className="absolute inset-0 rounded-[22px] bg-paper-deep" aria-hidden />
      <span
        aria-hidden
        className="absolute left-1/2 top-3 z-30 size-2.5 -translate-x-1/2 rounded-full bg-community-red shadow-[0_1px_3px_rgba(19,35,30,0.25)]"
      />

      <div className="absolute right-3 top-5 z-10 w-[60%] rotate-[3deg] rounded-md border border-civic-line bg-notice-yellow-soft px-4 py-3 shadow-[0_2px_10px_rgba(19,35,30,0.06)]">
        <p className="text-[13px] font-medium leading-snug text-ink">
          {t.heroBoardNoticeTitle}
        </p>
        <p className="mt-1.5 text-[12px] text-ink/70">{t.heroBoardNoticeLabel}</p>
      </div>

      <div className="absolute left-3 top-24 z-20 w-[90%] rotate-[-2deg] rounded-md border border-civic-line bg-white px-5 py-4 shadow-[0_8px_28px_-8px_rgba(19,35,30,0.18)]">
        <p className="text-[13px] text-slate">{t.heroBoardOrgLine}</p>
        <p className="mt-1 text-[16px] font-semibold leading-snug text-ink">
          {t.heroBoardTaskTitle}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-civic-line bg-paper px-2 py-0.5 text-[11px] font-medium text-ink">
            <MapPin className="size-3" aria-hidden /> {t.heroBoardNearYou}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-field-green">
            <CheckCircle2 className="size-3.5" aria-hidden /> {t.heroBoardSnapCert}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-civic-line pt-3 text-[12px] text-slate">
          <span>{t.heroBoardDuration}</span>
          <span className="inline-flex items-center gap-1 font-medium text-civic-blue">{t.heroBoardVolunteer} <ArrowRight className="size-3.5" /></span>
        </div>
      </div>

      <div className="absolute bottom-6 left-3 z-30 w-[64%] rotate-[-4deg] rounded-md border border-[#c4d8c9] bg-verification-sage p-4 shadow-[0_4px_18px_-4px_rgba(19,35,30,0.12)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold text-ink">{t.heroBoardHoursCertified}</p>
            <p className="mt-0.5 text-[12px] text-field-green">{t.heroBoardThisMonth}</p>
          </div>
          <span className="stamp">{t.heroBoardApproved}</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1 text-[10px] text-ink/70">
          <div className="border-t border-field-green/30 pt-1.5">{t.heroBoardTreeCensus}<br /><span className="text-ink">{t.heroBoardTreeHours}</span></div>
          <div className="border-t border-field-green/30 pt-1.5">{t.heroBoardTranslation}<br /><span className="text-ink">{t.heroBoardTranslationHours}</span></div>
          <div className="border-t border-field-green/30 pt-1.5">{t.heroBoardAudits}<br /><span className="text-ink">{t.heroBoardAuditHours}</span></div>
        </div>
      </div>

      <div className="absolute bottom-3 right-4 z-30 rotate-[2deg] rounded-md border border-civic-line bg-white px-3 py-2 shadow-sm">
        <p className="text-[12px] font-medium text-ink">{t.heroBoardWorkHours}</p>
      </div>
    </div>
  );
}

/* ───── Outcome card ─────────────────────────────────────────────── */
function OutcomeCard({
  tint,
  Icon,
  label,
  title,
  body,
}: {
  tint: string;
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className={`${tint} rounded-lg border border-civic-line/60 p-6`}>
      <Icon className="size-6 text-ink" strokeWidth={1.75} aria-hidden />
      <h3 className="mt-4 text-[18px] font-semibold leading-snug text-ink">{title}</h3>
      <p className="mt-1.5 text-[13px] text-slate">{label}</p>
      <p className="mt-3 text-sm leading-relaxed text-body">{body}</p>
    </div>
  );
}

/* ───── Certification preview ────────────────────────────────────── */
function CertPreview({ t }: { t: // eslint-disable-next-line @typescript-eslint/no-explicit-any
any }) {
  return (
    <div className="card-flat overflow-hidden">
      <div className="border-b border-civic-line bg-paper px-6 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[15px] font-semibold text-ink">{t.certTitle}</p>
            <p className="mt-0.5 text-[12px] text-slate">{t.certSubtitle}</p>
          </div>
          <span className="stamp">{t.certApproved}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 px-6 py-5 sm:grid-cols-2 sm:px-8 sm:py-6">
        <Field label={t.certFieldVolunteer}>{t.certFieldVolunteerValue}</Field>
        <Field label={t.certFieldMonth}>{t.certFieldMonthValue}</Field>
        <Field label={t.certFieldCase}>{t.certFieldCaseValue}</Field>
        <Field label={t.certFieldReviewedBy}>{t.certFieldReviewedByValue}</Field>
        <div className="col-span-full mt-4 border-t border-civic-line pt-4">
          <p className="text-[13px] font-medium text-slate">{t.certHoursByCategory}</p>
          <ul className="mt-2 divide-y divide-civic-line/70 text-sm">
            <Row name={t.certRow0Name} hours={t.certRow0Hours} />
            <Row name={t.certRow1Name} hours={t.certRow1Hours} />
            <Row name={t.certRow2Name} hours={t.certRow2Hours} />
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-civic-line pt-3 text-sm">
            <span className="font-semibold text-ink">{t.certTotalLabel}</span>
            <span className="font-semibold text-field-green">{t.certTotalValue}</span>
          </div>
        </div>
      </div>

      <div className="border-t border-civic-line bg-paper px-6 py-3 text-[12px] text-slate sm:px-8">
        {t.certFooter}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-civic-line py-1.5 first:pt-0 sm:border-b-0 sm:pr-6 sm:[&:nth-child(2n)]:pl-6 sm:[&:nth-child(2n)]:pr-0 sm:[&:nth-child(2n)]:border-l">
      <p className="text-[12px] text-slate">{label}</p>
      <p className="mt-0.5 text-[15px] font-medium text-ink">{children}</p>
    </div>
  );
}

function Row({ name, hours }: { name: string; hours: string }) {
  return (
    <li className="flex items-center justify-between py-2 text-ink">
      <span>{name}</span>
      <span className="text-slate">{hours} h</span>
    </li>
  );
}

function PartnerRow({
  Icon,
  title,
  sub,
}: {
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  title: string;
  sub: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-md border border-civic-line p-4">
      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-civic-line bg-paper text-field-green">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div>
        <p className="text-[15px] font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-[13px] text-slate">{sub}</p>
      </div>
    </li>
  );
}
