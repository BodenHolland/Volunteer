import { ArticleShell } from "../_components/article-shell";
import { AuthorityBadge } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";

export const metadata = { title: "Why remote and online volunteer hours count — Help Center" };
const { prev, next } = neighbors(5);

export default function Page() {
  return (
    <ArticleShell number={5} starred title="Why remote and online volunteer hours count" prev={prev} next={next}>
      <p>Remote and online volunteering is not specifically addressed in current SNAP guidance. It is also not excluded. Tended&apos;s position is that the model is unaddressed, not prohibited, and is defensible under the existing framework.</p>
      <p>This article shows what the authority does and does not say, and what supports the position by analogy. Claims are graded:</p>
      <ul>
        <li><AuthorityBadge level="direct" /> Regulation, statute, or official guidance says so.</li>
        <li><AuthorityBadge level="analogical" /> Related law or precedent supports it.</li>
        <li><AuthorityBadge level="unaddressed" /> No on-point authority either way.</li>
      </ul>

      <h2>The honest baseline</h2>
      <p><AuthorityBadge level="unaddressed" /> We have searched FNS, California CDSS, and New York OTDA published guidance. None of it specifically addresses remote, virtual, or AI-validated volunteer hours. None of it requires in-person work. The applicable California form (CF 888) and policy letter (ACL 25-34) describe &ldquo;the organization where the person volunteers&rdquo; without distinguishing in-person from remote.</p>
      <p>This is a genuine regulatory gap. We do not claim it is silence in our favor, and we do not pretend it is silence against us.</p>

      <h2>Why the federal authority covers remote work</h2>
      <p><AuthorityBadge level="direct" /> <strong>7 CFR §273.24(a)(2)(iii)</strong> counts &ldquo;unpaid work, verified under standards established by the State agency.&rdquo; The text does not distinguish in-person work from remote work. The operative requirement is that the state have a verification standard. California and New York both do.</p>

      <h2>Remote nonprofit volunteering is an established form of service</h2>
      <p><AuthorityBadge level="analogical" /> Large nonprofit programs have run on remote volunteers for years:</p>
      <ul>
        <li><strong>Smithsonian Transcription Center.</strong> Volunteers transcribe Smithsonian collections from anywhere.</li>
        <li><strong>Library of Congress &ldquo;By the People.&rdquo;</strong> Remote crowdsourced transcription of LoC holdings.</li>
        <li><strong>Zooniverse.</strong> Large-scale citizen science with remote participation.</li>
        <li><strong>Tarjimly.</strong> Remote volunteer translation for refugees and limited-English residents.</li>
      </ul>
      <p>These programs show that remote, online, massively-parallel volunteering for a qualifying nonprofit is a recognized form of charitable service. A person who reviews an AI-generated translation from home is performing the same kind of volunteer work as someone reviewing it in a community-center office.</p>

      <h2>Federal endorsement of remote citizen-science contribution</h2>
      <p><AuthorityBadge level="analogical" /> The <strong>Crowdsourcing and Citizen Science Act of 2016</strong> directs federal agencies to use citizen science, defined to include public participation that involves contributing data. Federal agencies including <strong>EPA Participatory Science</strong>, the <strong>USDA Forest Service</strong>, and the <strong>National Park Service</strong> treat volunteer data contribution as a recognized volunteer activity. This is not SNAP authority, but it is direct federal endorsement that remote volunteer data contribution to public-benefit research is a legitimate volunteer act.</p>
      <p>Source: <a href="https://www.epa.gov/participatory-science" target="_blank" rel="noopener noreferrer">EPA Participatory Science</a>.</p>

      <h2>How Tended treats the gap in practice</h2>
      <p>Because the area is unaddressed, the platform is designed conservatively:</p>
      <ul>
        <li>Measured engagement, not estimates. (See How we verify volunteer hours.)</li>
        <li>Verifiable deliverables produced inside the platform.</li>
        <li>Real public-benefit outputs distributed free.</li>
        <li>Public methodology. (See Audit &amp; methodology ledger.)</li>
        <li>Pre-clearance conversations with state and county welfare departments, rather than waiting to be discovered in an audit.</li>
      </ul>
      <p>If a county questions a CF 888 Tended signed, the recipient is entitled to a state fair hearing. (See What happens if a county questions your hours.) Tended&apos;s records are the evidence supporting the certification.</p>

      <h2>What we don&apos;t claim</h2>
      <p>We do not claim any federal agency has specifically blessed remote/online volunteer hours under SNAP. No such guidance exists.</p>
      <p>We do not claim our position is bulletproof. Unaddressed-but-defensible is a different category from settled.</p>
      <p>We do not advise volunteers to argue with their caseworker. If your hours are questioned, contact a SNAP legal-aid attorney.</p>
      <hr />
      <p><em>Not legal advice.</em></p>
    </ArticleShell>
  );
}
