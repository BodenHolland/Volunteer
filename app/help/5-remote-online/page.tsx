import { ArticleShell } from "../_components/article-shell";
import { AuthorityBadge } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Why remote and online volunteer hours count — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(5, locale);
  const title =
    locale === "es"
      ? "Por qué cuentan las horas de voluntariado remoto y en línea"
      : "Why remote and online volunteer hours count";

  return (
    <ArticleShell number={5} starred title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>El voluntariado remoto y en línea no se aborda específicamente en la orientación actual de SNAP. Tampoco está excluido. La posición de Tended es que el modelo no está abordado, no prohibido, y es defendible bajo el marco existente.</p>
          <p>Este artículo muestra lo que la autoridad sí dice y lo que no dice, y lo que respalda la posición por analogía. Las afirmaciones están clasificadas:</p>
          <ul>
            <li><AuthorityBadge level="direct" /> Un reglamento, estatuto u orientación oficial lo dice.</li>
            <li><AuthorityBadge level="analogical" /> Una ley o precedente relacionado lo respalda.</li>
            <li><AuthorityBadge level="unaddressed" /> No hay autoridad directa en ningún sentido.</li>
          </ul>

          <h2>La base honesta</h2>
          <p><AuthorityBadge level="unaddressed" /> Hemos buscado en la orientación publicada de FNS, CDSS de California y OTDA de Nueva York. Ninguna aborda específicamente las horas de voluntariado remoto, virtual o validado por IA. Ninguna exige trabajo presencial. El formulario aplicable de California (CF 888) y la carta de política (ACL 25-34) describen &ldquo;la organización donde la persona hace voluntariado&rdquo; sin distinguir entre presencial y remoto.</p>
          <p>Es un genuino vacío regulatorio. No afirmamos que sea silencio a nuestro favor, y no fingimos que sea silencio en nuestra contra.</p>

          <h2>Por qué la autoridad federal cubre el trabajo remoto</h2>
          <p><AuthorityBadge level="direct" /> <strong>7 CFR §273.24(a)(2)(iii)</strong> cuenta &ldquo;el trabajo no remunerado, verificado conforme a los estándares establecidos por la agencia estatal.&rdquo; El texto no distingue el trabajo presencial del trabajo remoto. El requisito operativo es que el estado tenga un estándar de verificación. California y Nueva York lo tienen.</p>

          <h2>El voluntariado remoto para organizaciones sin fines de lucro es una forma de servicio establecida</h2>
          <p><AuthorityBadge level="analogical" /> Grandes programas sin fines de lucro han funcionado con voluntarios remotos durante años:</p>
          <ul>
            <li><strong>Smithsonian Transcription Center.</strong> Los voluntarios transcriben las colecciones del Smithsonian desde cualquier lugar.</li>
            <li><strong>Library of Congress &ldquo;By the People.&rdquo;</strong> Transcripción colaborativa remota de los fondos de la LoC.</li>
            <li><strong>Zooniverse.</strong> Ciencia ciudadana a gran escala con participación remota.</li>
            <li><strong>Tarjimly.</strong> Traducción voluntaria remota para refugiados y residentes con dominio limitado del inglés.</li>
          </ul>
          <p>Estos programas demuestran que el voluntariado remoto, en línea y masivamente paralelo para una organización sin fines de lucro que califica es una forma reconocida de servicio benéfico. Una persona que revisa una traducción generada por IA desde su casa está realizando el mismo tipo de trabajo voluntario que alguien que la revisa en la oficina de un centro comunitario.</p>

          <h2>Respaldo federal a la contribución remota de ciencia ciudadana</h2>
          <p><AuthorityBadge level="analogical" /> La <strong>Crowdsourcing and Citizen Science Act of 2016</strong> ordena a las agencias federales usar la ciencia ciudadana, definida de modo que incluye la participación pública que implica aportar datos. Las agencias federales, incluidas <strong>EPA Participatory Science</strong>, el <strong>USDA Forest Service</strong> y el <strong>National Park Service</strong>, tratan la contribución de datos por voluntarios como una actividad de voluntariado reconocida. Esto no es autoridad de SNAP, pero es un respaldo federal directo de que la contribución remota de datos por voluntarios a la investigación de beneficio público es un acto de voluntariado legítimo.</p>
          <p>Fuente: <a href="https://www.epa.gov/participatory-science" target="_blank" rel="noopener noreferrer">EPA Participatory Science</a>.</p>

          <h2>Cómo trata Tended este vacío en la práctica</h2>
          <p>Como el área no está abordada, la plataforma está diseñada de forma conservadora:</p>
          <ul>
            <li>Participación medida, no estimaciones. (Ver Cómo verificamos las horas de voluntariado.)</li>
            <li>Entregables verificables producidos dentro de la plataforma.</li>
            <li>Resultados reales de beneficio público distribuidos gratis.</li>
            <li>Metodología pública. (Ver Registro de auditoría y metodología.)</li>
            <li>Conversaciones de pre-autorización con los departamentos de bienestar estatales y del condado, en lugar de esperar a ser descubiertos en una auditoría.</li>
          </ul>
          <p>Si un condado cuestiona un CF 888 que Tended firmó, el beneficiario tiene derecho a una audiencia imparcial del estado. (Ver Qué pasa si un condado cuestiona tus horas.) Los registros de Tended son la evidencia que respalda la certificación.</p>

          <h2>Lo que no afirmamos</h2>
          <p>No afirmamos que ninguna agencia federal haya aprobado específicamente las horas de voluntariado remoto/en línea bajo SNAP. No existe tal orientación.</p>
          <p>No afirmamos que nuestra posición sea infalible. No-abordado-pero-defendible es una categoría distinta de lo establecido.</p>
          <p>No aconsejamos a los voluntarios discutir con su trabajador social. Si se cuestionan tus horas, comunícate con un abogado de asistencia legal de SNAP.</p>
          <hr />
          <p><em>No es asesoría legal.</em></p>
        </>
      ) : (
        <>
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
        </>
      )}
    </ArticleShell>
  );
}
