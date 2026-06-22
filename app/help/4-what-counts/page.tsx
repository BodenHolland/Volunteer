import { ArticleShell } from "../_components/article-shell";
import { AuthorityBadge } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "What counts as SNAP volunteer hours — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(4, locale);
  const title =
    locale === "es"
      ? "Qué cuenta como horas de voluntariado para SNAP, y nuestra autoridad para ello"
      : "What counts as SNAP volunteer hours, and our authority for it";

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

          <h2>California: CF 888</h2>
          <p><AuthorityBadge level="direct" /> El estándar de California está en la <strong>All-County Letter (ACL) 25-34</strong> (14 de mayo de 2025) y el <strong>CF 888 — CalFresh ABAWD Volunteer Work Hours Verification Form</strong> (rev. 5/25).</p>
          <p>Datos clave sobre el CF 888:</p>
          <ul>
            <li>La Sección 2 la firma &ldquo;un representante de la organización donde la persona hace voluntariado.&rdquo;</li>
            <li>El formulario no tiene una declaración bajo pena de perjurio.</li>
            <li>No se exige que el firmante haya observado el trabajo.</li>
            <li>El condado puede, como alternativa, aceptar la declaración verbal de un representante autorizado.</li>
          </ul>
          <p>Fuentes: <a href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf" target="_blank" rel="noopener noreferrer">CF 888 (CDSS)</a>; <a href="https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/ABAWDs/StsfygABAWDWkReq.htm" target="_blank" rel="noopener noreferrer">Santa Clara County handbook</a>.</p>

          <h2>Nueva York: Monthly ABAWD Volunteer Participation Record</h2>
          <p><AuthorityBadge level="direct" /> Nueva York cuenta el servicio voluntario/comunitario para el requisito de trabajo, con las horas documentadas en el <strong>Monthly ABAWD Volunteer Participation Record</strong> y firmadas por la organización sin fines de lucro anfitriona. A diferencia del estándar fijo de 80 horas de California, Nueva York valora las horas de voluntariado en <em>asignación de SNAP ÷ salario mínimo</em>, lo que normalmente da un número mensual mucho menor. En la ciudad de Nueva York, la documentación se gestiona a través de <strong>ACCESS HRA</strong>.</p>
          <p>Fuentes: <a href="https://otda.ny.gov/programs/snap/work-requirements.asp" target="_blank" rel="noopener noreferrer">NY OTDA SNAP Work Requirements</a>; <a href="https://access.nyc.gov/snap-work-requirements/" target="_blank" rel="noopener noreferrer">NYC ACCESS HRA</a>.</p>

          <h2>Quién califica como organización verificadora</h2>
          <p><AuthorityBadge level="direct" /> Los marcos federales y estatales reconocen como organizaciones que califican a las organizaciones sin fines de lucro 501(c)(3) y 501(c)(4), agencias gubernamentales, escuelas y bancos de alimentos. No hay una lista estatal de pre-aprobación. Una carta de determinación reciente del IRS satisface la categoría.</p>
          <p>Tended es una 501(c)(3) y cumple los criterios.</p>

          <h2>Qué significa esto en la práctica</h2>
          <p>El reglamento federal abre la puerta. El estado provee el estándar de verificación. Tended es una organización que califica y que firma el formulario basándose en sus registros de plataforma.</p>
          <p>La pregunta derivada, si el voluntariado remoto y en línea específicamente cuenta, se aborda en el siguiente artículo.</p>
          <hr />
          <p><em>No es asesoría legal. Citas vigentes a la fecha de publicación.</em></p>
        </>
      ) : (
        <>
          <p>Federal law, the California verification standard, and the New York verification standard each allow unpaid volunteer work to count toward the SNAP/ABAWD work requirement. This article cites each one. Claims are graded:</p>
          <ul>
            <li><AuthorityBadge level="direct" /> Regulation, statute, or official guidance says so.</li>
            <li><AuthorityBadge level="analogical" /> Related law or precedent supports it.</li>
            <li><AuthorityBadge level="unaddressed" /> No on-point authority either way.</li>
          </ul>

          <h2>The federal hook</h2>
          <p><AuthorityBadge level="direct" /> Under federal SNAP regulations, the ABAWD work requirement can be met by &ldquo;working,&rdquo; and &ldquo;working&rdquo; is defined to include unpaid work verified under the state&apos;s standard.</p>
          <blockquote>
            <p><strong>7 CFR §273.24(a)(2):</strong> &ldquo;Working… includes: (i) Work in exchange for money; (ii) Work in exchange for goods or services (&apos;in kind&apos; work); or (iii) Unpaid work, verified under standards established by the State agency.&rdquo;</p>
          </blockquote>
          <p>Source: <a href="https://www.law.cornell.edu/cfr/text/7/273.24" target="_blank" rel="noopener noreferrer">7 CFR §273.24 (Cornell LII)</a>.</p>
          <p>That is the federal foundation. Unpaid volunteer work counts when the state has a verification standard for it. California and New York both do.</p>

          <h2>California: CF 888</h2>
          <p><AuthorityBadge level="direct" /> California&apos;s standard is in <strong>All-County Letter (ACL) 25-34</strong> (May 14, 2025) and the <strong>CF 888 — CalFresh ABAWD Volunteer Work Hours Verification Form</strong> (rev. 5/25).</p>
          <p>Key facts about CF 888:</p>
          <ul>
            <li>Section 2 is signed by &ldquo;a representative of the organization where the person volunteers.&rdquo;</li>
            <li>The form has no penalty-of-perjury jurat.</li>
            <li>The signer is not required to have observed the work.</li>
            <li>The county may, as an alternative, accept the verbal statement of an authorized representative.</li>
          </ul>
          <p>Sources: <a href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf" target="_blank" rel="noopener noreferrer">CF 888 (CDSS)</a>; <a href="https://stgenssa.sccgov.org/debs/program_handbooks/calfresh/assets/CalFresh/ABAWDs/StsfygABAWDWkReq.htm" target="_blank" rel="noopener noreferrer">Santa Clara County handbook</a>.</p>

          <h2>New York: Monthly ABAWD Volunteer Participation Record</h2>
          <p><AuthorityBadge level="direct" /> New York counts volunteer/community service toward the work requirement, with hours documented on the <strong>Monthly ABAWD Volunteer Participation Record</strong> and signed by the host nonprofit. Unlike California&apos;s flat 80-hour standard, New York values volunteer hours at <em>SNAP allotment ÷ minimum wage</em>, which is typically a much smaller monthly number. In NYC, documentation flows through <strong>ACCESS HRA</strong>.</p>
          <p>Sources: <a href="https://otda.ny.gov/programs/snap/work-requirements.asp" target="_blank" rel="noopener noreferrer">NY OTDA SNAP Work Requirements</a>; <a href="https://access.nyc.gov/snap-work-requirements/" target="_blank" rel="noopener noreferrer">NYC ACCESS HRA</a>.</p>

          <h2>Who qualifies as a verifying organization</h2>
          <p><AuthorityBadge level="direct" /> Federal and state frameworks recognize 501(c)(3) and 501(c)(4) nonprofits, government agencies, schools, and food banks as qualifying organizations. There is no state pre-approval list. A fresh IRS determination letter satisfies the category.</p>
          <p>Tended is a 501(c)(3) and meets the criteria.</p>

          <h2>What this means in practice</h2>
          <p>The federal regulation opens the door. The state supplies the verification standard. Tended is a qualifying organization that signs the form based on its platform records.</p>
          <p>The follow-on question, whether remote and online volunteering specifically counts, is covered in the next article.</p>
          <hr />
          <p><em>Not legal advice. Citations as of publication.</em></p>
        </>
      )}
    </ArticleShell>
  );
}
