import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";

export const metadata = { title: "How we verify volunteer hours — Help Center" };
const { prev, next } = neighbors(8);

export default function Page() {
  return (
    <ArticleShell number={8} starred title="How we verify volunteer hours" prev={prev} next={next}>
      <p>A caseworker or fair-hearing judge asking &ldquo;on what basis did Tended certify these hours?&rdquo; gets the answer here.</p>

      <h2>The rule</h2>
      <pre><code>{`certified hours = min(measured active engagement, calibrated cap)
                  gated on the deliverable passing per-submission validation`}</code></pre>
      <p>We certify actual time spent on the work, capped at an empirically calibrated maximum per task, only when the deliverable passes validation. We don&apos;t certify an estimate. We don&apos;t certify a flat per-task figure. We don&apos;t credit time when there wasn&apos;t genuine engagement.</p>

      <h2>Measured active engagement</h2>
      <p>The platform records active engagement during each task session.</p>
      <p>An active-session timer runs while you are interacting with the task. Idle detection pauses the timer when you stop interacting. A minimum-engagement floor prevents you from submitting before genuine engagement (a minimum time on the briefing, a minimum interaction with the deliverable form).</p>
      <p>This is the primary record of actual time spent. It&apos;s what the authorized representative signs from.</p>

      <h2>Volunteer self-attestation</h2>
      <p>At submission, you affirm that you personally performed the work and the recorded time reflects your genuine effort. The terms of service give Tended the right to validate, retain records, and correct or reverse credited hours if a submission is later found false.</p>

      <h2>The calibrated cap</h2>
      <p>Every task has a Maximum Allowable Time (MAT). The cap is calibrated to the observed median of real, quality-passing sessions for that task and recalibrated quarterly. (See How we calibrate hour caps for the methodology.)</p>
      <p>The cap only ever pulls a credited number down. If measured engagement is below the cap, that&apos;s what you get credit for. If it&apos;s at or above the cap, you get the cap.</p>

      <h2>Per-submission validation</h2>
      <p>Each submission goes through automated checks before any hours are credited:</p>
      <ul>
        <li>Completeness against the deliverable spec.</li>
        <li>Plausibility of the values (ranges, geocodes, photos resolving, dates making sense).</li>
        <li>PII screening before any aggregate output is distributed.</li>
        <li>Anti-duplication against your prior submissions and against other submissions.</li>
        <li>An engagement signal that matches the time-on-task band.</li>
      </ul>
      <p>Submissions that fail validation earn zero hours. Submissions outside the normal band are flagged for human spot-review. The authorized representative oversees the certification function and audits batches.</p>

      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t test for AI use. AI tools are permitted. AI-detection is unreliable and beside the point.</p>
      <p>We don&apos;t credit passive time. An open timer with no engagement records nothing useful.</p>
      <p>We don&apos;t pad hours, inflate estimates, or size content to extend the clock.</p>
      <p>We don&apos;t certify hours that exceed measured engagement.</p>

      <h2>The certifier</h2>
      <p>A real, named authorized representative designated by the board signs CF 888 Section 2 based on the records above. The representative oversees the methodology and is independent of the platform&apos;s growth and fundraising metrics. (See Who certifies your hours, and how.)</p>

      <h2>Open methodology</h2>
      <p>This methodology, current per-task caps, and the calibration changelog are published. Anyone can read them. (See Audit &amp; methodology ledger.)</p>
      <hr />
      <p><em>Not legal advice.</em></p>
    </ArticleShell>
  );
}
