import { ArticleShell } from "../_components/article-shell";
import { AuthorityBadge } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "What counts as SNAP volunteer hours — Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(4, locale);
  const title =
    locale === "es"
      ? "Qué cuenta como horas de voluntariado para SNAP, y nuestra autoridad para ello"
      : t.helpWhatCounts.title;

  return (
    <ArticleShell number={4} starred title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>La ley federal, el estándar de verificación de California y el estándar de verificación de Nueva York permiten, cada uno, que el trabajo voluntario no remunerado cuente para el requisito de trabajo de SNAP/ABAWD. Este artículo cita cada uno. Las afirmaciones están clasificadas:</p>
          <ul>
            <li><AuthorityBadge level="direct" /> Un reglamento, estatuto u orientación oficial lo dice.</li>
            <li><AuthorityBadge level="analogical" /> Una ley o precedente relacionado lo respalda.</li>
            <li><AuthorityBadge level="unaddressed" /> No hay autoridad directa en ningún sentido.</li>
          </ul>

          <h2>El fundamento federal</h2>
          <p><AuthorityBadge level="direct" /> Según los reglamentos federales de SNAP, el requisito de trabajo de ABAWD se puede cumplir &ldquo;trabajando,&rdquo; y &ldquo;trabajar&rdquo; se define de manera que incluye el trabajo no remunerado verificado conforme al estándar del estado.</p>
          <blockquote>
            <p><strong>7 CFR §273.24(a)(2):</strong> &ldquo;Working… includes: (i) Work in exchange for money; (ii) Work in exchange for goods or services (&apos;in kind&apos; work); or (iii) Unpaid work, verified under standards established by the State agency.&rdquo;</p>
          </blockquote>
          <p>Fuente: <a href="https://www.law.cornell.edu/cfr/text/7/273.24" target="_blank" rel="noopener noreferrer">7 CFR §273.24 (Cornell LII)</a>.</p>
          <p>Ese es el fundamento federal. El trabajo voluntario no remunerado cuenta cuando el estado tiene un estándar de verificación para ello. California y Nueva York lo tienen.</p>

          <h2>California: the CalFresh work-hours verification form</h2>
          <p><AuthorityBadge level="direct" /> El estándar de California está en la <strong>All-County Letter (ACL) 25-34</strong> (14 de mayo de 2025) y el <strong>formulario CalFresh ABAWD Volunteer Work Hours Verification</strong> (rev. 5/25).</p>
          <p>Datos clave sobre el formulario:</p>
          <ul>
            <li>La Sección 2 la firma &ldquo;un representante de la organización donde la persona hace voluntariado.&rdquo;</li>
            <li>El formulario no tiene una declaración bajo pena de perjurio.</li>
            <li>No se exige que el firmante haya observado el trabajo.</li>
            <li>El condado puede, como alternativa, aceptar la declaración verbal de un representante autorizado.</li>
          </ul>
          <p>Fuentes: <a href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf" target="_blank" rel="noopener noreferrer">California verification form (CDSS)</a>; <a href="https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/ABAWDs/StsfygABAWDWkReq.htm" target="_blank" rel="noopener noreferrer">Santa Clara County handbook</a>.</p>

          <h2>Nueva York: Monthly ABAWD Volunteer Participation Record</h2>
          <p><AuthorityBadge level="direct" /> Nueva York cuenta el servicio voluntario/comunitario para el requisito de trabajo, con las horas documentadas en el <strong>Monthly ABAWD Volunteer Participation Record</strong> y firmadas por la organización sin fines de lucro anfitriona. A diferencia del estándar fijo de 80 horas de California, Nueva York valora las horas de voluntariado en <em>asignación de SNAP ÷ salario mínimo</em>, lo que normalmente da un número mensual mucho menor. En la ciudad de Nueva York, la documentación se gestiona a través de <strong>ACCESS HRA</strong>.</p>
          <p>Fuentes: <a href="https://otda.ny.gov/programs/snap/work-requirements.asp" target="_blank" rel="noopener noreferrer">NY OTDA SNAP Work Requirements</a>; <a href="https://access.nyc.gov/snap-work-requirements/" target="_blank" rel="noopener noreferrer">NYC ACCESS HRA</a>.</p>

          <h2>Quién califica como organización verificadora</h2>
          <p><AuthorityBadge level="direct" /> Los marcos federales y estatales reconocen como organizaciones que califican a las organizaciones sin fines de lucro 501(c)(3) y 501(c)(4), agencias gubernamentales, escuelas y bancos de alimentos. No hay una lista estatal de pre-aprobación. Una carta de determinación reciente del IRS satisface la categoría.</p>
          <p>colift es una 501(c)(3) y cumple los criterios.</p>

          <h2>Qué significa esto en la práctica</h2>
          <p>El reglamento federal abre la puerta. El estado provee el estándar de verificación. colift es una organización que califica y que firma el formulario basándose en sus registros de plataforma.</p>
          <p>La pregunta derivada, si el voluntariado remoto y en línea específicamente cuenta, se aborda en el siguiente artículo.</p>
          <hr />
          <p><em>No es asesoría legal. Citas vigentes a la fecha de publicación.</em></p>
        </>
      ) : (
        <>
          <p>{t.helpWhatCounts.introPara}</p>
          <ul>
            <li><AuthorityBadge level="direct" /> {t.helpWhatCounts.badgeDirect}</li>
            <li><AuthorityBadge level="analogical" /> {t.helpWhatCounts.badgeAnalogical}</li>
            <li><AuthorityBadge level="unaddressed" /> {t.helpWhatCounts.badgeUnaddressed}</li>
          </ul>

          <h2>{t.helpWhatCounts.federalHeading}</h2>
          <p><AuthorityBadge level="direct" /> {t.helpWhatCounts.federalPara}</p>
          <blockquote>
            <p><strong>7 CFR §273.24(a)(2):</strong> &ldquo;{t.helpWhatCounts.federalBlockquote}&rdquo;</p>
          </blockquote>
          <p>{t.helpWhatCounts.federalSourcePre} <a href="https://www.law.cornell.edu/cfr/text/7/273.24" target="_blank" rel="noopener noreferrer">{t.helpWhatCounts.federalSourceLink}</a>.</p>
          <p>{t.helpWhatCounts.federalConclusion}</p>

          <h2>{t.helpWhatCounts.caHeading}</h2>
          <p><AuthorityBadge level="direct" /> {t.helpWhatCounts.caPara1Pre} <strong>{t.helpWhatCounts.caAcl}</strong> {t.helpWhatCounts.caPara1Mid} <strong>{t.helpWhatCounts.caForm}</strong> {t.helpWhatCounts.caPara1Post}</p>
          <p>{t.helpWhatCounts.caKeyFacts}</p>
          <ul>
            <li>{t.helpWhatCounts.caFact0}</li>
            <li>{t.helpWhatCounts.caFact1}</li>
            <li>{t.helpWhatCounts.caFact2}</li>
            <li>{t.helpWhatCounts.caFact3}</li>
          </ul>
          <p>{t.helpWhatCounts.caSourcesPre} <a href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf" target="_blank" rel="noopener noreferrer">{t.helpWhatCounts.caSourceForm}</a>; <a href="https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/ABAWDs/StsfygABAWDWkReq.htm" target="_blank" rel="noopener noreferrer">{t.helpWhatCounts.caSourceCounty}</a>.</p>

          <h2>{t.helpWhatCounts.nyHeading}</h2>
          <p><AuthorityBadge level="direct" /> {t.helpWhatCounts.nyPara1Pre} <strong>{t.helpWhatCounts.nyRecord}</strong> {t.helpWhatCounts.nyPara1Mid} <em>{t.helpWhatCounts.nyFormula}</em>{t.helpWhatCounts.nyPara1Post} <strong>{t.helpWhatCounts.nyAccessHra}</strong>{t.helpWhatCounts.nyPara1End}</p>
          <p>{t.helpWhatCounts.nySourcesPre} <a href="https://otda.ny.gov/programs/snap/work-requirements.asp" target="_blank" rel="noopener noreferrer">{t.helpWhatCounts.nySourceOtda}</a>; <a href="https://access.nyc.gov/snap-work-requirements/" target="_blank" rel="noopener noreferrer">{t.helpWhatCounts.nySourceAccess}</a>.</p>

          <h2>{t.helpWhatCounts.whoQualifiesHeading}</h2>
          <p><AuthorityBadge level="direct" /> {t.helpWhatCounts.whoQualifiesPara}</p>
          <p>{t.helpWhatCounts.whoQualifiesColift}</p>

          <h2>{t.helpWhatCounts.practiceHeading}</h2>
          <p>{t.helpWhatCounts.practicePara1}</p>
          <p>{t.helpWhatCounts.practicePara2}</p>
          <hr />
          <p><em>{t.helpWhatCounts.disclaimer}</em></p>
        </>
      )}
    </ArticleShell>
  );
}
