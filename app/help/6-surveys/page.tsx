import { ArticleShell } from "../_components/article-shell";
import { AuthorityBadge } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";

export const metadata = { title: "Surveys & community-research contributions — Help Center" };
const { prev, next } = neighbors(6);

export default function Page() {
  return (
    <ArticleShell number={6} title="Surveys & community-research contributions — how we approach them" prev={prev} next={next}>
      <p>Some Tended tasks involve volunteers contributing structured responses to community-research questions, such as observations that feed a needs assessment or a community report. This article explains how we treat those tasks, what supports the position, and what we won&apos;t do.</p>

      <h2>Honest status of the law</h2>
      <p><AuthorityBadge level="unaddressed" /> No FNS, CDSS, or OTDA guidance, ruling, or litigation we have found treats survey/research participation as qualifying SNAP volunteer hours. None excludes it either. This is genuinely untested.</p>
      <p>Tended treats survey tasks as a minority of the catalog, designs them conservatively, and raises them specifically in pre-clearance conversations with county welfare departments.</p>

      <h2>Our position</h2>
      <p>The defense is not that the data is valuable. The value of an output does not make the act &ldquo;work&rdquo; in the legal sense.</p>
      <p>The defense is that the volunteer is a contributor to a public-benefit community-research project, not a research subject. That framing has analogical support:</p>
      <ul>
        <li><AuthorityBadge level="analogical" /> The <strong>Crowdsourcing and Citizen Science Act of 2016</strong> endorses volunteer data contribution as a public good. Federal agencies (EPA, USDA, NPS) run participatory-science programs that treat data contribution as a volunteer act.</li>
        <li><AuthorityBadge level="analogical" /> Community-Based Participatory Research (CBPR) frameworks at NIH, CDC, and AHRQ recognize community members as research partners when the research is genuinely participatory and public-benefit.</li>
        <li><AuthorityBadge level="analogical" /> Nonprofit-hospital <strong>Community Health Needs Assessments</strong> (IRS §501(r)) are legally mandated public-benefit research products built from community-reported data.</li>
        <li><AuthorityBadge level="direct" /> <strong>7 CFR §273.24(a)(2)(iii)</strong> counts &ldquo;unpaid work, verified under standards established by the State agency,&rdquo; without defining the term so narrowly as to exclude research contribution.</li>
      </ul>

      <h2>The nine gates a survey task must pass</h2>
      <p>A survey or self-report task must clear all nine before it enters the catalog:</p>
      <ol>
        <li>Unpaid. No cash, gift card, or other incentive.</li>
        <li>The deliverable is named and specific.</li>
        <li>The decision-maker who will use the deliverable is named.</li>
        <li>The recipient organization is a qualifying org (501(c)(3), government, school, or food bank).</li>
        <li>The work requires substantive structured effort, not a click-through.</li>
        <li>The aggregate serves others, not the respondent.</li>
        <li>Completion and engagement are measurable.</li>
        <li>PII is minimized. The least personal data needed; aggregated and de-identified before any distribution.</li>
        <li>The task is framed as research contribution, not personal benefit.</li>
      </ol>

      <h2>What we don&apos;t design</h2>
      <p>Paid or incentivized participation. Personal self-tracking with no external research use. Click-through participation. Anything where the respondent is the only beneficiary. Anything we would sell.</p>

      <h2>Our preference when there&apos;s a choice</h2>
      <p>When an external-environment observation task can do the same job as a self-report survey, we design the observation task instead. It carries no &ldquo;subject&rdquo; risk and produces a self-verifying artifact. &ldquo;Document fresh-food prices at five stores near you&rdquo; is what we&apos;d build before &ldquo;report your own grocery spending.&rdquo;</p>
      <hr />
      <p><em>Not legal advice.</em></p>
    </ArticleShell>
  );
}
