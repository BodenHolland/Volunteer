import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Privacy, PII, and what we publish — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(11);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: "Quién certifica tus horas, y cómo" } : undefined;
    const nextEs = next ? { ...next, title: "Para trabajadores sociales: una metodología en una página" } : undefined;
    return (
      <ArticleShell number={11} title="Privacidad, datos personales y lo que publicamos" prev={prevEs} next={nextEs}>
        <p>Algunas tareas de Tended implican que los voluntarios aporten observaciones o conocimientos que pueden incluir información personal, propia o de otras personas. Esto describe cómo se maneja eso.</p>

        <h2>Principios</h2>
        <p>Recopilamos solo la información que una tarea realmente necesita para producir su entregable.</p>
        <p>Antes de distribuir cualquier resultado agregado, los envíos se revisan en busca de información personal, y se redactan cuando corresponde.</p>
        <p>Los datos personales se conservan solo el tiempo necesario para el entregable y el registro de verificación.</p>
        <p>Los resultados se distribuyen gratis a destinatarios alineados con la misión, pero &ldquo;gratis&rdquo; no significa &ldquo;totalmente público.&rdquo; El acceso se controla para proteger la privacidad. Algunos resultados se agregan y se anonimizan antes de cualquier divulgación.</p>
        <p>Los datos relacionados con la salud, las imágenes de personas identificables y el contenido sobre personas vulnerables reciben un manejo más estricto.</p>

        <h2>Lo que les pedimos a los voluntarios</h2>
        <p>Cuando una tarea podría implicar información personal, las instrucciones te dicen qué incluir y qué dejar fuera. Como regla general:</p>
        <ul>
          <li>No incluyas tu número de Seguro Social, tu fecha de nacimiento completa, números de cuentas financieras ni números de identificación gubernamental.</li>
          <li>No incluyas información personal sobre otras personas identificables sin su conocimiento.</li>
          <li>Al fotografiar espacios públicos o fachadas de comercios, evita captar rostros o detalles identificables de transeúntes siempre que sea posible.</li>
        </ul>

        <h2>Lo que no hacemos</h2>
        <p>No vendemos los datos de los voluntarios. Tended se financia con subvenciones y donaciones. No somos un intermediario de datos.</p>
        <p>No usamos IA para detectar IA en tu trabajo. No estamos vigilando tus herramientas. Estamos auditando si un esfuerzo genuino produjo una contribución utilizable.</p>
        <p>No exigimos ID.me, reconocimiento facial, selfis ni la recopilación del número de Seguro Social. El estado ya verificó tu identidad a través de la inscripción en SNAP. Tended atestigua tu trabajo, no tu identidad.</p>

        <h2>Monitoreo de actividad</h2>
        <p>La plataforma monitorea la participación activa durante una tarea. El temporizador, la detección de inactividad y las señales de desplazamiento/toque existen por una sola razón: certificar el tiempo realmente medido. El monitoreo está ligado a la tarea. Solo corre mientras una sesión de tarea está activa. La Política de Privacidad lo describe en detalle.</p>

        <h2>Cookies y analítica</h2>
        <p>Usamos solo dos cookies de origen propio: <code>tended_session</code> (te mantiene con sesión iniciada) y <code>locale</code> (recuerda tu idioma). Ninguna se usa para publicidad ni para seguimiento entre sitios.</p>
        <p>Usamos <strong>Cloudflare Web Analytics</strong>, que es sin cookies y por diseño no identifica a usuarios. Vemos métricas agregadas como vistas de página, país y rendimiento del sitio, sin rastro por persona. Por eso no mostramos un banner de &ldquo;Aceptar / Rechazar cookies&rdquo;: no hay nada que rechazar más allá de las cookies funcionales arriba.</p>
        <p>Cloudflare, como nuestro proveedor de hosting, también registra automáticamente datos del servidor (conteos de solicitudes, códigos de estado, país) y puede establecer cookies de seguridad estrictamente necesarias para mitigar bots.</p>

        <h2>Nota legal</h2>
        <p>Las organizaciones sin fines de lucro de California quedan en gran medida fuera del núcleo de la CCPA/CPRA, pero los deberes de notificación de filtraciones de datos y otros deberes de privacidad siguen vigentes. El programa de privacidad es revisado por asesoría legal.</p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={11} title="Privacy, PII, and what we publish" prev={prev} next={next}>
      <p>Some Tended tasks involve volunteers contributing observations or knowledge that can include personal information, their own or others&apos;. This describes how that&apos;s handled.</p>

      <h2>Principles</h2>
      <p>We collect only the information a task actually needs to produce its deliverable.</p>
      <p>Before any aggregate output is distributed, submissions are screened for personal information, and redacted where appropriate.</p>
      <p>Personal data is retained only as long as it&apos;s needed for the deliverable and the verification record.</p>
      <p>Outputs are distributed free to mission-aligned recipients, but &ldquo;free&rdquo; does not mean &ldquo;fully public.&rdquo; Access is controlled to protect privacy. Some outputs are aggregated and de-identified before any release.</p>
      <p>Health-adjacent data, images of identifiable people, and content about vulnerable individuals receive stricter handling.</p>

      <h2>What we ask of volunteers</h2>
      <p>Where a task could involve personal information, the instructions tell you what to include and what to leave out. As a general rule:</p>
      <ul>
        <li>Don&apos;t include your Social Security Number, full birth date, financial account numbers, or government ID numbers.</li>
        <li>Don&apos;t include personal information about identifiable other people without their knowledge.</li>
        <li>When photographing public spaces or storefronts, avoid capturing faces or identifying details of bystanders where possible.</li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t sell volunteer data. Tended is funded by grants and donations. We are not a data broker.</p>
      <p>We don&apos;t use AI to detect AI in your work. We are not surveilling your tooling. We are auditing whether genuine effort produced a usable contribution.</p>
      <p>We don&apos;t require ID.me, facial recognition, selfies, or SSN collection. The state already verified your identity through SNAP enrollment. Tended attests to your work, not your identity.</p>

      <h2>Activity monitoring</h2>
      <p>The platform monitors active engagement during a task. The timer, idle detection, and scroll/tap signals exist for one reason: to certify actual measured time. The monitoring is task-bound. It runs only while a task session is active. The Privacy Policy describes it in full.</p>

      <h2>Cookies and analytics</h2>
      <p>We set just two first-party cookies: <code>tended_session</code> (keeps you signed in) and <code>locale</code> (remembers your language). Neither is used for advertising or cross-site tracking.</p>
      <p>We use <strong>Cloudflare Web Analytics</strong>, which is cookieless and by design does not identify visitors. We see aggregate page views, country, and site performance — no per-person trail. That&apos;s why we don&apos;t show an &ldquo;Accept / Reject cookies&rdquo; banner: there&apos;s nothing to reject beyond the functional cookies above.</p>
      <p>Cloudflare, as our hosting provider, also automatically records server-side request data (counts, status codes, country) and may set strictly-necessary security cookies for bot mitigation.</p>

      <h2>Legal note</h2>
      <p>California nonprofits sit largely outside the CCPA/CPRA&apos;s core, but data-breach and other privacy duties remain. The privacy program is reviewed by counsel.</p>
    </ArticleShell>
  );
}
