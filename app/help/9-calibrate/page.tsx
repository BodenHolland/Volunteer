import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";

export const metadata = { title: "How we calibrate hour caps — Help Center" };
const { prev, next } = neighbors(9);

export default function Page() {
  return (
    <ArticleShell number={9} title="How we calibrate hour caps" prev={prev} next={next}>
      <p>Every task on Tended has a Maximum Allowable Time (MAT). This is how the cap gets set, and how it stays honest.</p>

      <h2>The standard</h2>
      <p>The cap is calibrated to the observed median of real, quality-passing volunteer sessions for that task. Not the founder&apos;s intuition. Not an AI&apos;s a priori guess. Not a number engineered to make a month&apos;s requirement easier to hit.</p>
      <p>The process:</p>
      <ol>
        <li>Seed an initial cap from a task decomposition. Reading load (words divided by reading speed), data-entry items, output length, required interactions.</li>
        <li>Collect actual measured engagement times from real volunteers who completed the task and whose deliverable passed validation.</li>
        <li>Set the cap at or near the median of those quality-passing sessions.</li>
        <li>Recalibrate quarterly, with a written changelog.</li>
      </ol>

      <h2>The cap is a ceiling, not a target</h2>
      <p>The cap can only pull a credited number down. If you finish a task in less than the cap, you get credit for your actual measured engagement. The cap exists to catch outliers, not to award everyone the maximum.</p>

      <h2>Why we do it this way</h2>
      <p>It is honest. We certify time that real volunteers actually spent.</p>
      <p>It is defensible. A written, dated methodology calibrated against real session data is the strongest answer to a reviewer asking how a per-task number was set.</p>
      <p>It protects everyone. The volunteer isn&apos;t certified for hours they didn&apos;t work. The certifier isn&apos;t signing inflated numbers. County acceptance depends on the records being credible.</p>

      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t &ldquo;estimate on the high side&rdquo; to be generous. Generosity here would be false attestation.</p>
      <p>We don&apos;t set caps as a multiple of an estimate (max = 2× est). The cap is empirical.</p>
      <p>We don&apos;t size task content to extend the cap.</p>

      <h2>Transparency</h2>
      <p>The methodology document, current caps, and changelog are published. (See Audit &amp; methodology ledger.)</p>
    </ArticleShell>
  );
}
