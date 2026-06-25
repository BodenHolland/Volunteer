import Link from "next/link";
import {
  Scale,
  ShieldCheck,
  Database,
  Mail,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "For caseworkers — colift",
  description:
    "A plain-language methodology overview for county welfare caseworkers and benefits staff reviewing CF 888 or equivalent state forms signed by colift.",
};

export default async function ForCaseworkersPage() {
  const { t } = await getDict();

  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-14 md:px-6 md:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <Scale className="h-3.5 w-3.5" />
                {t.forCaseworkers.heroBadge}
              </div>
              <Link href="/help/12-caseworkers" className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700">
                {t.forCaseworkers.heroHelpLink}
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {t.forCaseworkers.heroTitle}
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              {t.forCaseworkers.heroIntro.replace("CF 888", "")}
              <strong>{t.forCaseworkers.heroIntroCf888}</strong>
              {t.forCaseworkers.heroIntro.slice(t.forCaseworkers.heroIntro.indexOf("CF 888") + 6)}
            </p>
          </div>
        </section>

        {/* Who we are */}
        <section className="border-b border-slate-200 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">{t.forCaseworkers.whoWeAreTitle}</h2>
            <p className="mt-4 text-slate-700">
              {t.forCaseworkers.whoWeArePara1.replace("501(c)(3) public charity", "")}<strong>{t.forCaseworkers.whoWeArePara1Bold}</strong>{t.forCaseworkers.whoWeArePara1.slice(t.forCaseworkers.whoWeArePara1.indexOf("501(c)(3) public charity") + "501(c)(3) public charity".length)}
            </p>
            <p className="mt-3 text-slate-700">
              {t.forCaseworkers.whoWeArePara2Pre}{" "}
              <strong>{t.forCaseworkers.whoWeArePara2Bold}</strong>{" "}
              {t.forCaseworkers.whoWeArePara2Post}
            </p>
          </div>
        </section>

        {/* Legal authority */}
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-3">
              <Scale className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">{t.forCaseworkers.legalTitle}</h2>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800">{t.forCaseworkers.legalFederalTitle}</h3>
                <p className="mt-2 text-slate-700">
                  {t.forCaseworkers.legalFederalPara}
                </p>
                <blockquote className="mt-3 rounded-md bg-paper-deep px-4 py-3 text-sm italic text-slate-700">
                  {t.forCaseworkers.legalFederalQuote}
                  <span className="mt-1 block text-xs text-slate-500">
                    {t.forCaseworkers.legalFederalCite}{" "}
                    <a
                      href="https://www.law.cornell.edu/cfr/text/7/273.24"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      {t.forCaseworkers.legalFederalCiteLink}
                    </a>
                  </span>
                </blockquote>
                <p className="mt-3 text-slate-700">
                  {t.forCaseworkers.legalFederalNote}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">{t.forCaseworkers.legalCaliforniaTitle}</h3>
                <p className="mt-2 text-slate-700">
                  {t.forCaseworkers.legalCaliforniaPre}{" "}
                  <strong>{t.forCaseworkers.legalCaliforniaAcl}</strong>{" "}
                  {t.forCaseworkers.legalCaliforniaAnd}{" "}
                  <strong>{t.forCaseworkers.legalCaliforniaCf888}</strong>{" "}
                  {t.forCaseworkers.legalCaliforniaPost}
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {[
                    t.forCaseworkers.legalCaliforniaItem0,
                    t.forCaseworkers.legalCaliforniaItem1,
                    t.forCaseworkers.legalCaliforniaItem2,
                    t.forCaseworkers.legalCaliforniaItem3,
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  {t.forCaseworkers.legalCaliforniaSourcesPre}{" "}
                  <a
                    href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {t.forCaseworkers.legalCaliforniaCf888Link}
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/ABAWDs/StsfygABAWDWkReq.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {t.forCaseworkers.legalCaliforniaScLink}
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">{t.forCaseworkers.legalNyTitle}</h3>
                <p className="mt-2 text-slate-700">
                  {t.forCaseworkers.legalNyPara1Pre}{" "}
                  <strong>{t.forCaseworkers.legalNyRecord}</strong>{" "}
                  {t.forCaseworkers.legalNyPara1Mid}{" "}
                  <em>{t.forCaseworkers.legalNyFormula}</em>
                  {t.forCaseworkers.legalNyPara1Post}{" "}
                  <strong>{t.forCaseworkers.legalNyAccessHra}</strong>
                  {t.forCaseworkers.legalNyPara1End}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {t.forCaseworkers.legalNySourcesPre}{" "}
                  <a
                    href="https://otda.ny.gov/programs/snap/work-requirements.asp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {t.forCaseworkers.legalNyOtdaLink}
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://access.nyc.gov/snap-work-requirements/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    {t.forCaseworkers.legalNyHraLink}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Remote volunteering */}
        <section className="border-b border-slate-200 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <h2 className="text-xl font-semibold text-slate-900">
                {t.forCaseworkers.remoteTitle}
              </h2>
            </div>
            <p className="mt-4 text-slate-700">
              {t.forCaseworkers.remotePara1Pre}{" "}
              <strong>{t.forCaseworkers.remotePara1Bold}</strong>
              {t.forCaseworkers.remotePara1Post}{" "}
              <em>{t.forCaseworkers.remotePara1Em}</em>
              {t.forCaseworkers.remotePara1End}
            </p>
            <p className="mt-3 text-slate-700">
              {t.forCaseworkers.remotePara2}
            </p>
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>
                  <strong>{t.forCaseworkers.remoteItem0Bold}</strong>{" "}
                  {t.forCaseworkers.remoteItem0Rest}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>
                  <strong>{t.forCaseworkers.remoteItem1Bold}</strong>{" "}
                  {t.forCaseworkers.remoteItem1Rest}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>
                  <strong>{t.forCaseworkers.remoteItem2Bold}</strong>{" "}
                  {t.forCaseworkers.remoteItem2Rest}
                </span>
              </li>
            </ul>
            <p className="mt-4 text-slate-700">
              {t.forCaseworkers.remotePara3}
            </p>
          </div>
        </section>

        {/* Verification methodology */}
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">{t.forCaseworkers.verifyTitle}</h2>
            </div>
            <p className="mt-4 text-slate-700">
              {t.forCaseworkers.verifyIntro}
            </p>
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 font-mono text-sm text-slate-800">
              {t.forCaseworkers.verifyFormula}
              <br />
              <span className="text-slate-500">{t.forCaseworkers.verifyFormulaNote}</span>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="font-semibold text-slate-800">{t.forCaseworkers.verifyMeasuredTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  {t.forCaseworkers.verifyMeasuredPre}{" "}
                  <strong>{t.forCaseworkers.verifyMeasuredIdle}</strong>{" "}
                  {t.forCaseworkers.verifyMeasuredAnd}{" "}
                  <strong>{t.forCaseworkers.verifyMeasuredFloors}</strong>{" "}
                  {t.forCaseworkers.verifyMeasuredPost}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{t.forCaseworkers.verifyCapTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  {t.forCaseworkers.verifyCapPre}{" "}
                  <strong>{t.forCaseworkers.verifyCapBold}</strong>
                  {t.forCaseworkers.verifyCapPost}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{t.forCaseworkers.verifyDeliverableTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  {t.forCaseworkers.verifyDeliverablePara}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{t.forCaseworkers.verifyOrgTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  {t.forCaseworkers.verifyOrgPara}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{t.forCaseworkers.verifyAttestTitle}</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  {t.forCaseworkers.verifyAttestPara}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Public data */}
        <section className="border-b border-slate-200 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-3">
              <Database className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">
                {t.forCaseworkers.publicDataTitle}
              </h2>
            </div>
            <p className="mt-4 text-slate-700">
              {t.forCaseworkers.publicDataPara1}
            </p>
            <p className="mt-3 text-slate-700">
              {t.forCaseworkers.publicDataPara2Pre}{" "}
              <strong>{t.forCaseworkers.publicDataPara2Bold}</strong>{" "}
              {t.forCaseworkers.publicDataPara2Post}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {[
                t.forCaseworkers.publicDataItem0,
                t.forCaseworkers.publicDataItem1,
                t.forCaseworkers.publicDataItem2,
                t.forCaseworkers.publicDataItem3,
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link
                href="/deliverables"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
              >
                {t.forCaseworkers.publicDataBrowse}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <span className="mx-3 text-slate-300">|</span>
              <Link
                href="/data"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
              >
                {t.forCaseworkers.publicDataDownload}
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* What we don't do */}
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">{t.forCaseworkers.dontDoTitle}</h2>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
              {[
                t.forCaseworkers.dontDoItem0,
                t.forCaseworkers.dontDoItem1,
                t.forCaseworkers.dontDoItem2,
                t.forCaseworkers.dontDoItem3,
                t.forCaseworkers.dontDoItem4,
                t.forCaseworkers.dontDoItem5,
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Appeals */}
        <section className="border-b border-slate-200 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">{t.forCaseworkers.appealsTitle}</h2>
            <p className="mt-4 text-slate-700">
              {t.forCaseworkers.appealsPara1}
            </p>
            <p className="mt-3 text-slate-700">
              {t.forCaseworkers.appealsPara2Pre}{" "}
              <strong>{t.forCaseworkers.appealsPara2Bold}</strong>{" "}
              {t.forCaseworkers.appealsPara2Mid}{" "}
              <Link href="/help" className="text-blue-600 underline hover:text-blue-800">
                {t.forCaseworkers.appealsPara2Link}
              </Link>
              {t.forCaseworkers.appealsPara2End}
            </p>
            <p className="mt-3 text-sm text-slate-500">
              {t.forCaseworkers.appealsNote}
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="px-4 py-14 md:px-6 md:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-6 py-8 md:px-8">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{t.forCaseworkers.contactTitle}</h2>
                  <p className="mt-2 text-sm text-slate-700">
                    {t.forCaseworkers.contactPara}
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    {t.forCaseworkers.contactBtn}
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs text-slate-400">
              {t.forCaseworkers.contactDisclaimer}
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
