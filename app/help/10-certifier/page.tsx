import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";

export const metadata = { title: "Who certifies your hours — Help Center" };
const { prev, next } = neighbors(10);

export default function Page() {
  return (
    <ArticleShell number={10} title="Who certifies your hours, and how" prev={prev} next={next}>
      <p>On the California CF 888, the New York Monthly ABAWD Volunteer Participation Record, and equivalent state forms, the signature in the organization section is what makes the form valid. Here&apos;s who signs, what they certify, and what the law requires.</p>

      <h2>Who signs</h2>
      <p>A real, named individual who is an authorized representative of Tended. Usually an officer, employee, or board-designated agent. The board formally designates the authorized representative(s) and documents the delegation. &ldquo;Tended, Inc.&rdquo; doesn&apos;t sign in the abstract. A named human stands behind every certification.</p>

      <h2>What the form requires</h2>
      <p>The verified CF 888 (rev. 5/25), Section 2:</p>
      <blockquote>
        <p>&ldquo;For the month of ______, I certify that the person named above volunteered or performed community service for the organization I represent for ______ hours. The volunteer activity is: ☐ Ongoing ☐ One Time.&rdquo;</p>
      </blockquote>
      <p>What the form does not require is worth noting:</p>
      <ul>
        <li>No penalty-of-perjury jurat is printed on the form. (Knowingly false hours still carry separate fraud exposure under federal and state law. We take that seriously regardless.)</li>
        <li>No observation or supervision of the volunteer. The signer is &ldquo;a representative of the organization where the person volunteers.&rdquo; The law does not require the representative to have watched the work.</li>
        <li>No EIN field. An EIN may appear on a separate participant certificate Tended issues alongside the form, but the operative document is the CF 888.</li>
      </ul>

      <h2>What the representative is certifying</h2>
      <p>The representative certifies the actual volunteered hours, which is the number the verification system records. (See How we verify volunteer hours.) The certification is to the records, per the documented methodology, not from personal observation. This is the same pattern a food-bank coordinator uses when signing a sign-in sheet without having watched every shift minute.</p>

      <h2>How the signature is applied</h2>
      <p>E-signatures are valid under federal (ESIGN Act, 15 U.S.C. §7001) and California (UETA, Civ. Code §1633.1 et seq.) law. The CF 888 has no notary requirement. The platform may apply the authorized representative&apos;s e-signature automatically to forms generated from records that have passed validation.</p>
      <p>Auto-signing changes the mechanics, not the accountability. The named representative oversees the methodology, samples and audits batches, and stands behind every form bearing their signature.</p>

      <h2>Independence from fundraising and growth</h2>
      <p>The certification function is walled off from fundraising and growth metrics by policy. The representative&apos;s role is not measured by how many CF 888s they sign or how many recipients are enrolled. (See Who funds Tended for the funding-firewall details.)</p>

      <h2>What this is not</h2>
      <p>It is not Tended attesting to the volunteer&apos;s identity. The state already verified identity through CalFresh enrollment. Tended attests to the work.</p>
      <p>It is not a personal observation by the signer of each hour. The law does not require that, and we don&apos;t represent it.</p>
      <hr />
      <p><em>Not legal advice. Reference: <a href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf" target="_blank" rel="noopener noreferrer">CF 888 (CDSS)</a>.</em></p>
    </ArticleShell>
  );
}
