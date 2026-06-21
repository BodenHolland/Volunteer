import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";

export const metadata = { title: "What does NOT count — Help Center" };
const { prev, next } = neighbors(7);

export default function Page() {
  return (
    <ArticleShell number={7} title="What does NOT count" prev={prev} next={next}>
      <p>Here is what Tended won&apos;t credit as volunteer hours, and why.</p>

      <h2>Self-help and personal-benefit tasks</h2>
      <p>Updating your own resume. Building your LinkedIn. Tracking your own habits. Setting personal goals. These benefit the volunteer, not the community. SNAP volunteer/community service has to be service to others.</p>

      <h2>Paid surveys or any compensated participation</h2>
      <p>Paid research participation is income. That fails the &ldquo;unpaid work&rdquo; requirement under 7 CFR §273.24(a)(2)(iii), and can affect SNAP eligibility on its own. Cash, gift cards, raffle entries, and money-equivalents all count as compensation.</p>

      <h2>Social media posting and personal advocacy</h2>
      <p>Tweets, posts, and shares on your own accounts are personal action. The work product doesn&apos;t reach the organization. There&apos;s no deliverable Tended can use.</p>

      <h2>Education and training you receive</h2>
      <p>Attending a workshop, completing a course, watching a training video. These belong to the SNAP Employment &amp; Training (E&amp;T) pathway, which is a separate state contract and a separate model. Tended does not currently operate in the E&amp;T lane.</p>

      <h2>Lobbying and partisan political work</h2>
      <p>Advocating for specific legislation or candidates. A 501(c)(3) cannot make lobbying a substantial part of its activities (IRC §501(c)(3); §501(h) limits). Civic education and nonpartisan voter engagement are fine. Lobbying and campaigning are not.</p>

      <h2>Passive time</h2>
      <p>Starting a timer, leaving a tab open, letting the clock run while you do something else. Time without engagement is not work, and the platform&apos;s idle detection won&apos;t credit it.</p>

      <h2>Padded content</h2>
      <p>We don&apos;t credit reading time engineered to inflate the clock, repeated identical submissions, or content sized to extend a task. Credited hours equal actual measured engagement, capped per task.</p>

      <h2>Self-disclosure without a real research use</h2>
      <p>General &ldquo;tell us about yourself&rdquo; prompts with no named deliverable. These fail the survey-task gates. (See Surveys &amp; community-research contributions.)</p>

      <h2>Deliberately unverifiable claims</h2>
      <p>Tasks designed so the claim can&apos;t be checked. A task we can&apos;t verify is a CF 888 we can&apos;t sign for in good faith.</p>

      <h2>Commercial labor in disguise</h2>
      <p>Labeling data for a for-profit startup. Doing tasks for a commercial vendor. Not charitable service to a qualifying organization.</p>
      <hr />
      <p><em>If you want to propose a task type, every idea gets checked against this list and against the internal qualification test. Not legal advice.</em></p>
    </ArticleShell>
  );
}
