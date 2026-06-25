import { ArticleShell } from "../_components/article-shell";
import { AuthorityBadge } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Surveys & community-research contributions — Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(6, locale);
  const title =
    locale === "es"
      ? "Encuestas y contribuciones de investigación comunitaria — cómo las abordamos"
      : t.helpSurveys.title;

  return (
    <ArticleShell number={6} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>Algunas tareas de colift implican que los voluntarios aporten respuestas estructuradas a preguntas de investigación comunitaria, como observaciones que alimentan una evaluación de necesidades o un informe comunitario. Este artículo explica cómo tratamos esas tareas, qué respalda la posición y qué no haremos.</p>

          <h2>Estado honesto de la ley</h2>
          <p><AuthorityBadge level="unaddressed" /> Ninguna orientación, resolución o litigio de FNS, CDSS u OTDA que hayamos encontrado trata la participación en encuestas/investigación como horas de voluntariado de SNAP que califican. Ninguna la excluye tampoco. Esto es genuinamente no probado.</p>
          <p>colift trata las tareas de encuesta como una minoría del catálogo, las diseña de forma conservadora y las plantea específicamente en las conversaciones de pre-autorización con los departamentos de bienestar del condado.</p>

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
            <li>Los datos personales se minimizan. La menor cantidad de datos personales necesaria; aggregados y desidentificados antes de cualquier distribución.</li>
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
          <p>{t.helpSurveys.intro}</p>

          <h2>{t.helpSurveys.lawStatusHeading}</h2>
          <p><AuthorityBadge level="unaddressed" /> {t.helpSurveys.lawStatusPara1}</p>
          <p>{t.helpSurveys.lawStatusPara2}</p>

          <h2>{t.helpSurveys.positionHeading}</h2>
          <p>{t.helpSurveys.positionPara1}</p>
          <p>{t.helpSurveys.positionPara2}</p>
          <ul>
            <li><AuthorityBadge level="analogical" /> The <strong>Crowdsourcing and Citizen Science Act of 2016</strong> {t.helpSurveys.positionBullet0}</li>
            <li><AuthorityBadge level="analogical" /> {t.helpSurveys.positionBullet1}</li>
            <li><AuthorityBadge level="analogical" /> Nonprofit-hospital <strong>Community Health Needs Assessments</strong> {t.helpSurveys.positionBullet2}</li>
            <li><AuthorityBadge level="direct" /> <strong>7 CFR §273.24(a)(2)(iii)</strong> {t.helpSurveys.positionBullet3}</li>
          </ul>

          <h2>{t.helpSurveys.nineGatesHeading}</h2>
          <p>{t.helpSurveys.nineGatesIntro}</p>
          <ol>
            <li>{t.helpSurveys.gate0}</li>
            <li>{t.helpSurveys.gate1}</li>
            <li>{t.helpSurveys.gate2}</li>
            <li>{t.helpSurveys.gate3}</li>
            <li>{t.helpSurveys.gate4}</li>
            <li>{t.helpSurveys.gate5}</li>
            <li>{t.helpSurveys.gate6}</li>
            <li>{t.helpSurveys.gate7}</li>
            <li>{t.helpSurveys.gate8}</li>
          </ol>

          <h2>{t.helpSurveys.dontDesignHeading}</h2>
          <p>{t.helpSurveys.dontDesignPara}</p>

          <h2>{t.helpSurveys.preferenceHeading}</h2>
          <p>{t.helpSurveys.preferencePara}</p>
          <hr />
          <p><em>{t.helpSurveys.legalNote}</em></p>
        </>
      )}
    </ArticleShell>
  );
}
