import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";

export const metadata = { title: "What happens if a county questions your hours — Help Center" };
const { prev, next } = neighbors(14);

export default function Page() {
  return (
    <ArticleShell number={14} title="What happens if a county questions your hours" prev={prev} next={next}>
      <p>If a county rejects a CF 888 (or the equivalent state form) that Tended signed, here is what the law provides. This is factual information, not legal advice or coaching. If your benefits are at stake, contact a SNAP legal-aid attorney.</p>

      <h2>SNAP benefits have due-process protection</h2>
      <p>SNAP benefits are a protected entitlement under <em>Goldberg v. Kelly</em>, 397 U.S. 254 (1970). A county cannot reduce or terminate your benefits without a formal process.</p>

      <h2>1. Notice of Action</h2>
      <p>If a county takes adverse action on your case, you are entitled to a written Notice of Action stating the reason and your appeal rights (7 CFR §273.13).</p>

      <h2>2. State fair hearing</h2>
      <p>You can request a state fair hearing before an Administrative Law Judge (ALJ). The ALJ is not a county employee. They review the rejection independently.</p>
      <ul>
        <li>Federal: 7 U.S.C. §2020(e)(10); 7 CFR §273.15.</li>
        <li>California: Cal. Welf. &amp; Inst. Code §10950 et seq.</li>
        <li>New York: request a fair hearing through OTDA.</li>
      </ul>
      <p>At the hearing, the ALJ examines whether the verification supporting the hours was adequate. Tended&apos;s records (validation logs, measured engagement data, the published methodology) are evidence that supports the hearing.</p>

      <h2>3. Aid paid pending</h2>
      <p>If you request the fair hearing before the action&apos;s effective date, your benefits generally continue during the appeal (7 CFR §273.15(k)). Timing matters. Don&apos;t delay.</p>

      <h2>4. Judicial review</h2>
      <p>If you don&apos;t prevail at the fair hearing, you may seek judicial review. In California, that&apos;s a writ of administrative mandamus under Cal. Code Civ. Proc. §1094.5. You generally must exhaust the fair hearing first.</p>

      <h2>What Tended can do</h2>
      <p>On request, Tended can provide the records that support the certification we signed: validation logs, the published methodology, and your measured engagement data. This is the evidence a hearing relies on.</p>

      <h2>What you should do</h2>
      <p>Read the Notice of Action carefully. Note any deadlines.</p>
      <p>Contact a SNAP legal-aid attorney immediately. (See Where to get legal help.)</p>
      <p>Save copies of all communications with the county.</p>
      <p>Request the fair hearing before the action&apos;s effective date if you can, so benefits stay paid pending.</p>
      <hr />
      <p><em>Not legal advice. Tended is not a law firm.</em></p>
    </ArticleShell>
  );
}
