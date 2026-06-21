import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";

export const metadata = { title: "How the platform works — Help Center" };
const { prev, next } = neighbors(2);

export default function Page() {
  return (
    <ArticleShell number={2} title="How the platform works (for volunteers)" prev={prev} next={next}>
      <p>Here is what you do on Tended and what happens with your time.</p>

      <h2>The loop</h2>
      <ol>
        <li>You browse tasks. Each one tells you what you&apos;ll do, what deliverable you produce, who uses it, and the time it usually takes.</li>
        <li>You complete the task in the app. The platform records your active time on the task. The timer pauses when you stop interacting.</li>
        <li>You submit your work. Automated checks confirm the deliverable is complete and usable. Most submissions clear automatically. Flagged ones get a human spot-review.</li>
        <li>Hours are recorded. The credited number is your measured engagement, capped per task. (See How we verify volunteer hours.)</li>
        <li>At the end of the month, Tended generates your state form, pre-filled with the hours you completed and signed by an authorized representative.</li>
        <li>You upload the form to your benefits portal. In California, that&apos;s BenefitsCal. In New York, ACCESS HRA. The county processes it from there.</li>
      </ol>

      <h2>What gets certified</h2>
      <p>The number on the form is your actual measured engagement, up to a per-task cap. Not an estimate. Not a flat figure. Not time the platform recorded while you were idle.</p>

      <h2>What you can expect</h2>
      <p>Tasks don&apos;t run out. The platform is designed so that more contributors always mean more value, and new tasks open regularly.</p>
      <p>Most tasks are remote and can be done on a phone or computer. A few are field-based (a visit to a nearby store, for example). Those are optional.</p>
      <p>You can start and stop as you choose. Tended doesn&apos;t schedule you, set quotas, or manage you as an employee.</p>

      <h2>A note on AI tools</h2>
      <p>You can use AI tools when you do tasks. Tended does not test for AI use, and does not use AI to detect AI. The question we care about is whether genuine effort produced a usable contribution, which the validation already checks.</p>
      <hr />
      <p><em>If a county questions your hours, see What happens if a county questions your hours and Where to get legal help.</em></p>
    </ArticleShell>
  );
}
