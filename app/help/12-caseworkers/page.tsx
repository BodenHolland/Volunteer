import { ArticleShell } from "../_components/article-shell";
import { Placeholder } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";

export const metadata = { title: "For caseworkers — a one-page methodology — Help Center" };
const { prev, next } = neighbors(12);

export default function Page() {
  return (
    <ArticleShell number={12} starred title="For caseworkers — a one-page methodology" prev={prev} next={next}>
      <p><em>Written for county welfare caseworkers and benefits-program staff reviewing a CF 888 (or equivalent state form) signed by Tended.</em></p>

      <h2>Who we are</h2>
      <p>Tended is a 501(c)(3) public charity. We run an online civic-volunteer program. Volunteers contribute to public-benefit work, including food-access mapping, translation review, archive transcription, and accessibility audits. For volunteers subject to the ABAWD work requirement, Tended verifies their hours on the standard state form as the authorized representative of the organization where the volunteering occurred.</p>

      <h2>Authority</h2>
      <ul>
        <li>Federal: 7 CFR §273.24(a)(2)(iii). Unpaid work verified under the state&apos;s standard satisfies the ABAWD work requirement.</li>
        <li>California: ACL 25-34 (May 14, 2025) and the CF 888 (rev. 5/25). Tended signs Section 2 as the qualifying nonprofit.</li>
        <li>New York: OTDA Monthly ABAWD Volunteer Participation Record, signed by the host nonprofit. NYC documentation goes through ACCESS HRA.</li>
        <li>Tended&apos;s status: 501(c)(3) nonprofit with an IRS determination letter. There is no state pre-approval list for qualifying nonprofits. The IRS determination is the qualifying credential.</li>
      </ul>

      <h2>How we verify hours</h2>
      <p>The platform records active engagement during each task session, using a timer with idle detection, minimum-engagement floors, anti-duplication, and PII screening. Credited hours equal <code>min(measured engagement, calibrated cap)</code>, only when the deliverable passes per-submission validation. The cap is calibrated to the observed median of real, quality-passing sessions and recalibrated quarterly. The authorized representative certifies based on those records.</p>

      <h2>Remote and online volunteering</h2>
      <p>No published FNS, CDSS, or OTDA guidance specifically addresses remote or online volunteer hours. None requires in-person work. Tended&apos;s position is that remote volunteering is unaddressed, not prohibited. The position is supported by:</p>
      <ul>
        <li>The text of 7 CFR §273.24(a)(2)(iii), which does not distinguish in-person from remote work.</li>
        <li>Long-standing remote nonprofit volunteer programs (Smithsonian Transcription Center, Library of Congress &ldquo;By the People,&rdquo; Zooniverse, Tarjimly).</li>
        <li>Federal endorsement of remote citizen-science data contribution (Crowdsourcing and Citizen Science Act of 2016; EPA Participatory Science; USDA Forest Service).</li>
      </ul>

      <h2>Verifying a form</h2>
      <p>We welcome direct contact from caseworkers and county staff. If a form you received seems questionable, please contact us before rejecting it. We can confirm the records that support the certification.</p>
      <p>Contact: <Placeholder>[contact email]</Placeholder> / <Placeholder>[phone]</Placeholder>.</p>

      <h2>Audit access</h2>
      <p>Tended publishes an open methodology ledger covering the verification methodology, current per-task caps, the calibration changelog, and the validation criteria applied to each submission. Direct access: <Placeholder>[Audit &amp; methodology ledger]</Placeholder>.</p>

      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t certify hours that exceed measured engagement. We don&apos;t credit passive time. We don&apos;t pad hours. We don&apos;t certify work the volunteer did not perform. We don&apos;t test for AI use, and we don&apos;t believe doing so is appropriate.</p>
    </ArticleShell>
  );
}
