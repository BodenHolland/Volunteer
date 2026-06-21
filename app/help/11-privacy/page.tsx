import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";

export const metadata = { title: "Privacy, PII, and what we publish — Help Center" };
const { prev, next } = neighbors(11);

export default function Page() {
  return (
    <ArticleShell number={11} title="Privacy, PII, and what we publish" prev={prev} next={next}>
      <p>Some Tended tasks involve volunteers contributing observations or knowledge that can include personal information, their own or others&apos;. This describes how that&apos;s handled.</p>

      <h2>Principles</h2>
      <p>We collect only the information a task actually needs to produce its deliverable.</p>
      <p>Before any aggregate output is distributed, submissions are screened for personal information, and redacted where appropriate.</p>
      <p>Personal data is retained only as long as it&apos;s needed for the deliverable and the verification record.</p>
      <p>Outputs are distributed free to mission-aligned recipients, but &ldquo;free&rdquo; does not mean &ldquo;fully public.&rdquo; Access is controlled to protect privacy. Some outputs are aggregated and de-identified before any release.</p>
      <p>Health-adjacent data, images of identifiable people, and content about vulnerable individuals receive stricter handling.</p>

      <h2>What we ask of volunteers</h2>
      <p>Where a task could involve personal information, the instructions tell you what to include and what to leave out. As a general rule:</p>
      <ul>
        <li>Don&apos;t include your Social Security Number, full birth date, financial account numbers, or government ID numbers.</li>
        <li>Don&apos;t include personal information about identifiable other people without their knowledge.</li>
        <li>When photographing public spaces or storefronts, avoid capturing faces or identifying details of bystanders where possible.</li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t sell volunteer data. Tended is funded by grants and donations. We are not a data broker.</p>
      <p>We don&apos;t use AI to detect AI in your work. We are not surveilling your tooling. We are auditing whether genuine effort produced a usable contribution.</p>
      <p>We don&apos;t require ID.me, facial recognition, selfies, or SSN collection. The state already verified your identity through SNAP enrollment. Tended attests to your work, not your identity.</p>

      <h2>Activity monitoring</h2>
      <p>The platform monitors active engagement during a task. The timer, idle detection, and scroll/tap signals exist for one reason: to certify actual measured time. The monitoring is task-bound. It runs only while a task session is active. The Privacy Policy describes it in full.</p>

      <h2>Legal note</h2>
      <p>California nonprofits sit largely outside the CCPA/CPRA&apos;s core, but data-breach and other privacy duties remain. The privacy program is reviewed by counsel.</p>
    </ArticleShell>
  );
}
