import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";

export const metadata = { title: "What is Tended? — Help Center" };
const { prev, next } = neighbors(1);

export default function Page() {
  return (
    <ArticleShell number={1} title="What is Tended?" prev={prev} next={next}>
      <p>
        Tended is a nonprofit that runs an online civic-volunteering platform. People sign up, complete tasks that produce real public-benefit work, and the time they spend is verified and certified by Tended. For people receiving CalFresh or SNAP who are subject to the work requirement, those certified hours count toward the 80 hours per month (or, in New York, the state&apos;s lower formula-based total).
      </p>
      <p>
        The tasks are real. Volunteers document food access at local stores, review machine translations of public-agency materials, map sidewalks and curb ramps, transcribe public archives, and contribute to community-research projects partner organizations actually use.
      </p>

      <h2>A few things to be clear about</h2>
      <p>Tended is a 501(c)(3) public charity, funded by grants and donations.</p>
      <p>Tended does not sell the work volunteers produce. Outputs are distributed free to the partner agency, partner nonprofits, or the community.</p>
      <p>Volunteers are not paid. The SNAP benefit a participant receives is a state entitlement, not payment from Tended.</p>
      <p>Tended signs CF 888 Section 2 (in California) or the equivalent state form as the authorized representative of the organization where the volunteering happened. The signature is based on Tended&apos;s platform records.</p>
      <p>Tended is not a law firm, and nothing on this site is legal advice. If your benefits are in question, contact a SNAP legal-aid attorney.</p>

      <h2>Why this exists</h2>
      <p>
        Federal work requirements expanded in 2025. Many people now subject to them cannot easily reach traditional in-person volunteer sites because of disability, caregiving responsibilities, transportation, or local supply. Meanwhile, public agencies and community organizations have unmet needs for civic data, translation review, and other volunteer-produced work.
      </p>
      <p>
        Tended connects those two facts. The model is remote work that public agencies actually use, verified rigorously, and certified on the state&apos;s standard form.
      </p>
      <hr />
      <p><em>See also: How the platform works, Who funds Tended, What counts as SNAP volunteer hours.</em></p>
    </ArticleShell>
  );
}
