import { ArticleShell } from "../_components/article-shell";
import { Placeholder } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";

export const metadata = { title: "Audit & methodology ledger — Help Center" };
const { prev, next } = neighbors(13);

export default function Page() {
  return (
    <ArticleShell number={13} title="Audit & methodology ledger" prev={prev} next={next}>
      <p>Tended publishes an open methodology ledger so volunteers, caseworkers, partners, funders, and auditors can see how we verify volunteer hours and how the methodology has evolved.</p>

      <h2>What&apos;s in the ledger</h2>
      <p>The live version of the verification methodology, including the per-task validation criteria.</p>
      <p>Current per-task caps (Maximum Allowable Time, or MAT) for every active task, with a summary of the underlying calibration data.</p>
      <p>The calibration changelog. Every change to a cap or to the methodology, with the date and the reason.</p>
      <p>Aggregate submission statistics, anonymized. Total submissions, validation pass/fail rates, flag and spot-review rates. No individual records. No PII.</p>
      <p>The authorized-representative roster. Names, titles, and the date of board designation.</p>
      <p>The conflict-of-interest policy and the certification-function firewall.</p>

      <h2>What&apos;s not in the ledger</h2>
      <p>Information about specific recipients. Names, case numbers, hour counts, and SNAP-recipient status are not disclosed. Beneficiary information is protected under 7 CFR §272.1(c) and equivalent state safeguarding rules.</p>
      <p>Volunteer-specific data beyond what&apos;s required for aggregate statistics.</p>

      <h2>Why</h2>
      <p>Transparency is the audit defense. A reviewer asking how Tended certified a set of hours gets a complete answer without filing a request.</p>

      <h2>Access</h2>
      <p>The ledger is available at <Placeholder>[ledger URL]</Placeholder> and is linked from the QR code on the participant certificate Tended issues alongside each CF 888.</p>

      <h2>For formal reviews</h2>
      <p>State (CDSS, OTDA) and federal (FNS) reviewers can request a formal records pull, including the underlying validation logs and the per-recipient certification basis, subject to applicable safeguards. Contact: <Placeholder>[contact email]</Placeholder>.</p>
    </ArticleShell>
  );
}
