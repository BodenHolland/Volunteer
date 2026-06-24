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

export const metadata = {
  title: "For caseworkers — Tended",
  description:
    "A plain-language methodology overview for county welfare caseworkers and benefits staff reviewing CF 888 or equivalent state forms signed by Tended.",
};

export default async function ForCaseworkersPage() {
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
                For county welfare caseworkers &amp; benefits staff
              </div>
              <Link href="/help/12-caseworkers" className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-700">
                Also in Help Center →
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Tended verification methodology
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              This page is written for caseworkers and benefits-program staff reviewing a{" "}
              <strong>CF 888</strong> (or equivalent state form) signed by Tended. It explains
              our legal authority, how we verify hours, how our data is publicly auditable, and
              how to reach us before rejecting a form.
            </p>
          </div>
        </section>

        {/* Who we are */}
        <section className="border-b border-slate-200 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">Who we are</h2>
            <p className="mt-4 text-slate-700">
              Tended is a <strong>501(c)(3) public charity</strong> operating a civic-volunteer
              platform. Volunteers contribute to public-benefit tasks — food-access mapping,
              translation review, sidewalk-hazard documentation, archive transcription, and
              accessibility audits. All task output is published free to the public, partner
              agencies, and libraries. Tended does not sell volunteer output and is funded
              entirely by grants and donations.
            </p>
            <p className="mt-3 text-slate-700">
              For volunteers subject to the SNAP/ABAWD work requirement, Tended signs{" "}
              <strong>Section 2 of the CF 888</strong> as the authorized representative of the
              organization where the volunteering occurred. Our IRS 501(c)(3) determination
              letter is the qualifying credential — there is no state pre-approval list for
              qualifying nonprofits.
            </p>
          </div>
        </section>

        {/* Legal authority */}
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-3">
              <Scale className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">Legal authority</h2>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800">Federal — 7 CFR §273.24(a)(2)(iii)</h3>
                <p className="mt-2 text-slate-700">
                  Under federal SNAP regulations, the ABAWD work requirement can be met by
                  "working," and "working" includes:
                </p>
                <blockquote className="mt-3 border-l-4 border-blue-300 bg-blue-50 px-4 py-3 text-sm text-slate-700">
                  "(iii) Unpaid work, verified under standards established by the State agency."
                  <span className="mt-1 block text-xs text-slate-500">
                    7 CFR §273.24(a)(2) —{" "}
                    <a
                      href="https://www.law.cornell.edu/cfr/text/7/273.24"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Cornell LII
                    </a>
                  </span>
                </blockquote>
                <p className="mt-3 text-slate-700">
                  This is the federal foundation. Unpaid volunteer work counts when the state
                  has a verification standard for it. California and New York both do.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">California — ACL 25-34 and CF 888</h3>
                <p className="mt-2 text-slate-700">
                  California's verification standard is established in{" "}
                  <strong>All-County Letter (ACL) 25-34</strong> (May 14, 2025) and the{" "}
                  <strong>CF 888 — CalFresh ABAWD Volunteer Work Hours Verification Form</strong>{" "}
                  (rev. 5/25). Key facts about the form:
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {[
                    "Section 2 is signed by 'a representative of the organization where the person volunteers.' No supervision or observation is required.",
                    "The county may alternatively accept the verbal statement of an authorized representative.",
                    "The certified value is actual hours volunteered — not a task estimate.",
                    "There is no penalty-of-perjury jurat on the form.",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-slate-500">
                  Sources:{" "}
                  <a
                    href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    CF 888 (CDSS)
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/ABAWDs/StsfygABAWDWkReq.htm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    Santa Clara County ABAWD handbook
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">New York — Monthly ABAWD Volunteer Participation Record</h3>
                <p className="mt-2 text-slate-700">
                  New York counts volunteer and community service toward the work requirement,
                  with hours documented on the <strong>Monthly ABAWD Volunteer Participation
                  Record</strong> and signed by the host nonprofit. Unlike California's flat
                  80-hour standard, New York values hours at{" "}
                  <em>SNAP allotment ÷ minimum wage</em>, typically a much smaller monthly
                  number. In New York City, documentation flows through{" "}
                  <strong>ACCESS HRA</strong>.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Sources:{" "}
                  <a
                    href="https://otda.ny.gov/programs/snap/work-requirements.asp"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    NY OTDA SNAP Work Requirements
                  </a>{" "}
                  ·{" "}
                  <a
                    href="https://access.nyc.gov/snap-work-requirements/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    NYC ACCESS HRA
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
                Remote and online volunteering — honest framing
              </h2>
            </div>
            <p className="mt-4 text-slate-700">
              We want to be direct: <strong>no published FNS, CDSS, or OTDA guidance
              specifically addresses remote or online volunteer hours</strong>. None of it requires
              in-person work either. Our position is that remote volunteering is{" "}
              <em>unaddressed, not prohibited</em>.
            </p>
            <p className="mt-3 text-slate-700">
              This position is supported by:
            </p>
            <ul className="mt-3 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>
                  <strong>The text of 7 CFR §273.24(a)(2)(iii)</strong> — it does not
                  distinguish in-person from remote work. The operative requirement is that
                  the state have a verification standard.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>
                  <strong>Established remote nonprofit volunteer programs</strong> — Smithsonian
                  Transcription Center, Library of Congress "By the People," Zooniverse, and
                  Tarjimly have run large-scale remote volunteer programs for years, accepted
                  as legitimate nonprofit service.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>
                  <strong>Federal endorsement of remote citizen-science contribution</strong> —
                  the Crowdsourcing and Citizen Science Act of 2016, EPA Participatory Science,
                  USDA Forest Service, and the National Park Service treat remote volunteer data
                  contribution as a recognized volunteer activity.
                </span>
              </li>
            </ul>
            <p className="mt-4 text-slate-700">
              Because this area is unaddressed, we have designed the platform conservatively
              (measured engagement, verifiable deliverables, public methodology) and pursue
              pre-clearance conversations with state and county welfare departments rather than
              waiting to be discovered in an audit.
            </p>
          </div>
        </section>

        {/* Verification methodology */}
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
              <h2 className="text-xl font-semibold text-slate-900">How we verify hours</h2>
            </div>
            <p className="mt-4 text-slate-700">
              The certified number on every CF 888 is:
            </p>
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 font-mono text-sm text-slate-800">
              credited_hours = min( measured_active_engagement, calibrated_cap )
              <br />
              <span className="text-slate-500">— only when the deliverable passes quality review</span>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <h3 className="font-semibold text-slate-800">Measured active engagement</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  The platform records time using a session timer with <strong>idle
                  detection</strong> and <strong>minimum-engagement floors</strong> — a
                  volunteer cannot submit work before genuine engagement thresholds are met.
                  This is the primary record of actual time. It is the number Tended certifies,
                  not an estimate.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Calibrated cap per task</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  Each task has a cap set in two steps: (1) an AI task-decomposition seed
                  based on reading load, complexity, and expected output; (2){" "}
                  <strong>calibrated against the observed median of real, quality-passing
                  human sessions</strong>. The cap is recalibrated quarterly with a version
                  history. The cap is a ceiling only — it may pull a credited number down,
                  never up.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Automated deliverable validation</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  Each submission is checked to confirm a deliverable of the expected type is
                  present and usable, screened for personal information before release, and
                  flagged for pattern outliers (duplicate content, velocity anomalies, likely
                  AI-generated output). Flagged submissions go to human review.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Sponsoring-org quality review</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  Submissions are reviewed by a representative of the sponsoring nonprofit
                  before hours are credited. Reviewers may reduce credited hours for quality;
                  they cannot increase hours above measured time. Rejected or low-effort work
                  earns zero hours.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Volunteer attestation</h3>
                <p className="mt-1.5 text-sm text-slate-700">
                  The volunteer affirms they personally did the work and that the time is
                  genuine. Platform terms include the right to validate, retain records, and
                  reverse credited hours if a submission is later found false.
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
                Public data and audit access
              </h2>
            </div>
            <p className="mt-4 text-slate-700">
              Every dataset produced by volunteer work on Tended ships as a free public
              download. This is what makes the work qualify as community service — the output
              must be a public good, not a Tended-internal asset.
            </p>
            <p className="mt-3 text-slate-700">
              We publish an <strong>open methodology ledger</strong> that includes:
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {[
                "The current verification methodology in plain language",
                "Per-task hour caps and the calibration changelog",
                "Validation criteria applied to each submission type",
                "Submission-level records (de-identified) available to county staff upon request",
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
                Browse public deliverables
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <span className="mx-3 text-slate-300">|</span>
              <Link
                href="/data"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 underline underline-offset-4 hover:text-blue-800"
              >
                Download public datasets
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* What we don't do */}
        <section className="border-b border-slate-200 bg-slate-50 px-4 py-12 md:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-semibold text-slate-900">What we don't do</h2>
            <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
              {[
                "We never credit hours above the volunteer's measured active engagement.",
                "We never credit passive time — an open timer with no engagement measures nothing.",
                "We never pad hours or use task estimates as the certified number.",
                "We never certify work the volunteer did not perform.",
                "We never test for AI use in submissions, and we don't believe doing so is appropriate — the integrity question is whether genuine effort produced a usable deliverable, not what tools were used.",
                "We never sell volunteer output, de-identified datasets, or aggregated data.",
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
            <h2 className="text-xl font-semibold text-slate-900">If you're considering rejecting a form</h2>
            <p className="mt-4 text-slate-700">
              We welcome direct contact from caseworkers and county staff before a rejection
              decision. If a form looks questionable, we can pull the submission records that
              support the certification and share them with you directly.
            </p>
            <p className="mt-3 text-slate-700">
              If hours are rejected and the recipient believes the rejection was in error,
              they are entitled to a{" "}
              <strong>CDSS state fair hearing</strong> before an administrative law judge
              (7 CFR §273.15; Cal. Welf. &amp; Inst. Code §10950 et seq.). Tended's session
              records and methodology documentation serve as the evidentiary basis for that
              hearing. We encourage recipients with disputed hours to contact a{" "}
              <Link href="/help" className="text-blue-600 underline hover:text-blue-800">
                SNAP legal-aid organization
              </Link>
              .
            </p>
            <p className="mt-3 text-sm text-slate-500">
              Note: Tended does not guarantee that any county will accept a CF 888 we sign.
              We record and verify hours; the county determines eligibility. We state this
              clearly to every volunteer.
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
                  <h2 className="text-lg font-semibold text-slate-900">Contact us</h2>
                  <p className="mt-2 text-sm text-slate-700">
                    For verification questions, record requests, or methodology questions —
                    please reach out before rejecting a form. We respond to caseworker and
                    county staff inquiries promptly.
                  </p>
                  <Link
                    href="/contact"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Contact Tended
                  </Link>
                </div>
              </div>
            </div>

            <p className="mt-8 text-xs text-slate-400">
              This page is informational and does not constitute legal advice. Citations are to
              publicly available primary sources. The legal framework described here represents
              Tended's good-faith interpretation of the applicable regulations; counties retain
              discretion in administering the SNAP work requirement.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
