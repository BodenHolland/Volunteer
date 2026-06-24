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
          <p>El gobierno federal ya reconoce el voluntariado remoto y en línea como una forma legítima de servicio. La autoridad de SNAP para contar el trabajo voluntario se aplica al trabajo no remunerado verificable — no al lugar donde se realiza.</p>

          <h2>El reconocimiento federal de la contribución remota es explícito</h2>
          <p><AuthorityBadge level="direct" /> La <strong>Crowdsourcing and Citizen Science Act of 2016</strong> (15 U.S.C. §3724) ordena a las agencias federales usar la ciencia ciudadana, definida para incluir la participación pública en la que los voluntarios &ldquo;contribuyen con datos&rdquo; al trabajo del gobierno. Esto es una ley federal vigente — no analogía, no inferencia — que trata la contribución remota de voluntarios como una forma reconocida de servicio.</p>
          <p>Las agencias federales han implementado esto en programas a gran escala:</p>
          <ul>
            <li><strong>EPA Participatory Science</strong> — los voluntarios remotos contribuyen con datos de calidad del aire y del agua que respaldan decisiones reglamentarias.</li>
            <li><strong>USDA Forest Service</strong> y <strong>National Park Service</strong> — los voluntarios remotos registran observaciones de vida silvestre y mapeo del paisaje que alimentan la gestión federal de tierras.</li>
            <li><strong>NASA Citizen Science</strong> — los voluntarios remotos clasifican datos astronómicos para misiones financiadas con fondos federales.</li>
          </ul>
          <p>Fuente: <a href="https://www.epa.gov/participatory-science" target="_blank" rel="noopener noreferrer">EPA Participatory Science</a>; <a href="https://www.citizenscience.gov/" target="_blank" rel="noopener noreferrer">CitizenScience.gov</a>.</p>

          <h2>El texto de SNAP cubre todo el trabajo no remunerado verificado, en cualquier lugar</h2>
          <p><AuthorityBadge level="direct" /> <strong>7 CFR §273.24(a)(2)(iii)</strong> cuenta &ldquo;el trabajo no remunerado, verificado conforme a los estándares establecidos por la agencia estatal.&rdquo; El texto del reglamento no distingue el trabajo presencial del remoto. El único requisito operativo es un estándar de verificación. California (ACL 25-34, formulario CF 888) y Nueva York lo tienen.</p>
          <p>El formulario CF 888 de California describe &ldquo;la organización donde la persona hace voluntariado&rdquo; — sin requisito de presencia física. La organización certificadora atestigua las horas reales de trabajo; el formulario es neutral respecto a la ubicación.</p>

          <h2>El voluntariado remoto sin fines de lucro es servicio establecido</h2>
          <p><AuthorityBadge level="direct" /> Grandes programas sin fines de lucro han operado con voluntarios remotos durante años, aceptados por instituciones culturales federales y reconocidos como servicio benéfico legítimo:</p>
          <ul>
            <li><strong>Smithsonian Transcription Center</strong> — los voluntarios transcriben las colecciones del Smithsonian (una institución apoyada por el gobierno federal) desde cualquier lugar.</li>
            <li><strong>Library of Congress &ldquo;By the People&rdquo;</strong> — transcripción colaborativa remota de los fondos de la Biblioteca del Congreso.</li>
            <li><strong>Zooniverse</strong> — ciencia ciudadana a gran escala financiada en parte con becas federales.</li>
            <li><strong>Tarjimly</strong> — traducción voluntaria remota para refugiados, reconocida en programas de servicio social.</li>
          </ul>
          <p>Una persona que revisa una traducción generada por IA desde su casa está realizando el mismo tipo de trabajo voluntario que alguien que la revisa en la oficina de un centro comunitario. La forma del servicio es lo que importa, no el código postal del voluntario.</p>

          <h2>Cómo Tended encaja en este marco establecido</h2>
          <p>Tended es una organización sin fines de lucro 501(c)(3) que coordina voluntarios remotos para producir entregables públicos gratuitos. La plataforma:</p>
          <ul>
            <li>Mide la participación activa por sesión, no estima.</li>
            <li>Produce entregables verificables dentro de la plataforma — datos cívicos, traducciones, auditorías de accesibilidad.</li>
            <li>Distribuye gratuitamente todos los resultados al público, las bibliotecas y al gobierno.</li>
            <li>Publica su metodología de verificación de forma abierta.</li>
            <li>Realiza conversaciones de pre-autorización con los departamentos de bienestar estatales y del condado.</li>
          </ul>
          <p>La organización autorizada certifica las horas según los registros de la plataforma. Esos registros son la evidencia que respalda la certificación.</p>
          <hr />
          <p><em>No es asesoría legal.</em></p>
        </>
      ) : (
        <>
          <p>The federal government already recognizes remote and online volunteering as a legitimate form of service. The SNAP authority for counting volunteer work applies to verifiable unpaid work — not to where it happens.</p>

          <h2>Federal recognition of remote contribution is explicit</h2>
          <p><AuthorityBadge level="direct" /> The <strong>Crowdsourcing and Citizen Science Act of 2016</strong> (15 U.S.C. §3724) directs federal agencies to use citizen science, defined to include public participation where volunteers &ldquo;contribute data&rdquo; to government work. This is standing federal law — not analogy, not inference — that treats remote volunteer contribution as a recognized form of service.</p>
          <p>Federal agencies have implemented this at scale:</p>
          <ul>
            <li><strong>EPA Participatory Science</strong> — remote volunteers contribute air- and water-quality data that supports regulatory decisions.</li>
            <li><strong>USDA Forest Service</strong> and <strong>National Park Service</strong> — remote volunteers log wildlife observations and landscape mapping that feed federal land management.</li>
            <li><strong>NASA Citizen Science</strong> — remote volunteers classify astronomical data for federally-funded missions.</li>
          </ul>
          <p>Source: <a href="https://www.epa.gov/participatory-science" target="_blank" rel="noopener noreferrer">EPA Participatory Science</a>; <a href="https://www.citizenscience.gov/" target="_blank" rel="noopener noreferrer">CitizenScience.gov</a>.</p>

          <h2>The SNAP text covers all verified unpaid work, anywhere</h2>
          <p><AuthorityBadge level="direct" /> <strong>7 CFR §273.24(a)(2)(iii)</strong> counts &ldquo;unpaid work, verified under standards established by the State agency.&rdquo; The regulatory text does not distinguish in-person from remote work. The only operative requirement is a verification standard. California (ACL 25-34, form CF 888) and New York both have one.</p>
          <p>California&apos;s CF 888 form describes &ldquo;the organization where the person volunteers&rdquo; — with no physical-presence requirement. The certifying organization attests to the actual hours worked; the form is location-neutral.</p>

          <h2>Remote nonprofit volunteering is established service</h2>
          <p><AuthorityBadge level="direct" /> Large nonprofit programs have run on remote volunteers for years, accepted by federal cultural institutions and recognized as legitimate charitable service:</p>
          <ul>
            <li><strong>Smithsonian Transcription Center</strong> — volunteers transcribe Smithsonian collections (a federally-supported institution) from anywhere.</li>
            <li><strong>Library of Congress &ldquo;By the People&rdquo;</strong> — remote crowdsourced transcription of LoC holdings.</li>
            <li><strong>Zooniverse</strong> — large-scale citizen science funded in part by federal grants.</li>
            <li><strong>Tarjimly</strong> — remote volunteer translation for refugees, recognized in social-service programs.</li>
          </ul>
          <p>A person reviewing an AI-generated translation from home is performing the same kind of volunteer work as someone reviewing it in a community-center office. The shape of the service is what matters, not the volunteer&apos;s ZIP code.</p>

          <h2>How Tended fits this established framework</h2>
          <p>Tended is a 501(c)(3) nonprofit that coordinates remote volunteers to produce free public deliverables. The platform:</p>
          <ul>
            <li>Measures active engagement per session, not estimates.</li>
            <li>Produces verifiable deliverables inside the platform — civic data, translations, accessibility audits.</li>
            <li>Distributes every output free to the public, libraries, and government.</li>
            <li>Publishes its verification methodology openly.</li>
            <li>Pursues pre-clearance conversations with state and county welfare departments.</li>
          </ul>
          <p>The authorized organization certifies hours based on the platform&apos;s records. Those records are the evidence supporting the certification.</p>
          <hr />
          <p><em>Not legal advice.</em></p>
        </>
      )}
    </ArticleShell>
  );
}
