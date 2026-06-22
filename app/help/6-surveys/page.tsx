import { ArticleShell } from "../_components/article-shell";
import { AuthorityBadge } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Surveys & community-research contributions — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(6, locale);
  const title =
    locale === "es"
      ? "Encuestas y contribuciones de investigación comunitaria — cómo las abordamos"
      : "Surveys & community-research contributions — how we approach them";

  return (
    <ArticleShell number={6} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>Algunas tareas de Tended implican que los voluntarios aporten respuestas estructuradas a preguntas de investigación comunitaria, como observaciones que alimentan una evaluación de necesidades o un informe comunitario. Este artículo explica cómo tratamos esas tareas, qué respalda la posición y qué no haremos.</p>

          <h2>Estado honesto de la ley</h2>
          <p><AuthorityBadge level="unaddressed" /> Ninguna orientación, resolución o litigio de FNS, CDSS u OTDA que hayamos encontrado trata la participación en encuestas/investigación como horas de voluntariado de SNAP que califican. Ninguna la excluye tampoco. Esto es genuinamente no probado.</p>
          <p>Tended trata las tareas de encuesta como una minoría del catálogo, las diseña de forma conservadora y las plantea específicamente en las conversaciones de pre-autorización con los departamentos de bienestar del condado.</p>

          <h2>Nuestra posición</h2>
          <p>La defensa no es que los datos sean valiosos. El valor de un resultado no convierte el acto en &ldquo;trabajo&rdquo; en el sentido legal.</p>
          <p>La defensa es que el voluntario es un colaborador de un proyecto de investigación comunitaria de beneficio público, no un sujeto de investigación. Ese encuadre tiene respaldo analógico:</p>
          <ul>
            <li><AuthorityBadge level="analogical" /> La <strong>Crowdsourcing and Citizen Science Act of 2016</strong> respalda la contribución de datos por voluntarios como un bien público. Las agencias federales (EPA, USDA, NPS) gestionan programas de ciencia participativa que tratan la contribución de datos como un acto de voluntariado.</li>
            <li><AuthorityBadge level="analogical" /> Los marcos de Investigación Participativa Basada en la Comunidad (CBPR) de NIH, CDC y AHRQ reconocen a los miembros de la comunidad como socios de investigación cuando la investigación es genuinamente participativa y de beneficio público.</li>
            <li><AuthorityBadge level="analogical" /> Las <strong>Community Health Needs Assessments</strong> de hospitales sin fines de lucro (IRS §501(r)) son productos de investigación de beneficio público legalmente obligatorios, construidos a partir de datos reportados por la comunidad.</li>
            <li><AuthorityBadge level="direct" /> <strong>7 CFR §273.24(a)(2)(iii)</strong> cuenta &ldquo;el trabajo no remunerado, verificado conforme a los estándares establecidos por la agencia estatal,&rdquo; sin definir el término de manera tan estrecha como para excluir la contribución a la investigación.</li>
          </ul>

          <h2>Las nueve barreras que una tarea de encuesta debe pasar</h2>
          <p>Una tarea de encuesta o autoinforme debe superar las nueve antes de entrar al catálogo:</p>
          <ol>
            <li>No remunerada. Sin efectivo, tarjeta de regalo ni otro incentivo.</li>
            <li>El entregable está nombrado y es específico.</li>
            <li>El responsable de la toma de decisiones que usará el entregable está nombrado.</li>
            <li>La organización receptora es una organización que califica (501(c)(3), gobierno, escuela o banco de alimentos).</li>
            <li>El trabajo requiere un esfuerzo estructurado sustantivo, no un clic.</li>
            <li>El agregado sirve a otros, no al encuestado.</li>
            <li>La finalización y la participación son medibles.</li>
            <li>Los datos personales se minimizan. La menor cantidad de datos personales necesaria; agregados y desidentificados antes de cualquier distribución.</li>
            <li>La tarea se enmarca como contribución a la investigación, no como beneficio personal.</li>
          </ol>

          <h2>Lo que no diseñamos</h2>
          <p>Participación pagada o incentivada. Autoseguimiento personal sin uso externo de investigación. Participación de un solo clic. Cualquier cosa en la que el encuestado sea el único beneficiario. Cualquier cosa que venderíamos.</p>

          <h2>Nuestra preferencia cuando hay opción</h2>
          <p>Cuando una tarea de observación del entorno externo puede hacer el mismo trabajo que una encuesta de autoinforme, diseñamos la tarea de observación en su lugar. No conlleva ningún riesgo de &ldquo;sujeto&rdquo; y produce un artefacto autoverificable. &ldquo;Documenta los precios de alimentos frescos en cinco tiendas cerca de ti&rdquo; es lo que construiríamos antes que &ldquo;reporta tu propio gasto en comestibles.&rdquo;</p>
          <hr />
          <p><em>No es asesoría legal.</em></p>
        </>
      ) : (
        <>
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
        </>
      )}
    </ArticleShell>
  );
}
