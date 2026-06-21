import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";

export const metadata = { title: "Who funds Tended — Help Center" };
const { prev, next } = neighbors(3);

export default function Page() {
  return (
    <ArticleShell number={3} title="Who funds Tended" prev={prev} next={next}>
      <p>Tended is funded by grants and donations. Foundations, individuals, and corporate philanthropy. The work product volunteers produce is distributed free to the partner agency, the partner nonprofit, or the community. Tended does not sell data, deliverables, or research.</p>

      <h2>Why the funding structure matters here</h2>
      <p>Tended signs the state verification form. That means Tended is accountable for the integrity of each certification. A funding model that paid Tended per certified recipient would give the certifier a financial incentive to maximize what it certifies. That is the conflict the structure avoids.</p>

      <h2>What we accept</h2>
      <p>Foundation grants, individual donations, corporate philanthropy (including from companies with a commercial interest in food access and community well-being), and agency partnerships where the agency requests civic work and funds it via grant or sponsorship.</p>

      <h2>What we don&apos;t accept</h2>
      <p>Funding conditioned on, or priced per, certified recipient or enrollment outcome. Payment for the volunteer work product. Funding tied to legislative advocacy or partisan political work.</p>

      <h2>Governance</h2>
      <p>The certification function is walled off from fundraising. Funders do not influence which tasks exist, how hours are measured, or who is certified. Major funders are disclosed. The board oversees the certification function.</p>

      <h2>Lobbying</h2>
      <p>A 501(c)(3) cannot make lobbying a substantial part of its activities (IRC §501(c)(3); §501(h) caps it). Tended does not.</p>
      <hr />
      <p><em>See also: What is Tended?, How we verify volunteer hours.</em></p>
    </ArticleShell>
  );
}
