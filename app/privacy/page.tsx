import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Privacy Policy — Tended" };
export const dynamic = "force-dynamic";

const EFFECTIVE = "June 27, 2026";

export default async function PrivacyPage() {
  const locale = await getLocale();
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="mx-auto max-w-[760px] px-4 py-12 md:px-6 md:py-16">
          {locale === "es" ? <Es /> : <En />}
          <p className="mt-10 text-sm text-meta">
            {locale === "es" ? `Vigente a partir del ${EFFECTIVE}.` : `Effective ${EFFECTIVE}.`}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function En() {
  return (
    <article className="prose prose-neutral max-w-none space-y-4 text-body">
      <h1 className="text-[32px] font-semibold leading-tight text-ink md:text-[40px]">Privacy Policy</h1>
      <p>
        Tended is operated by a 501(c)(3) nonprofit. We collect only what we need to coordinate volunteer work,
        certify hours, and produce the public deliverables our partner organizations rely on. This policy
        explains what we collect, how we use it, who we share it with, and the choices you have.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">1. Information we collect</h2>
      <p><strong>Account information.</strong> When you create an account, we collect your name, email, and
        password (stored only as a salted hash via our authentication provider). If you sign in with Google, we
        receive your name, email, and profile image from Google.</p>
      <p><strong>Profile and certification information.</strong> If you choose to use Tended for SNAP/CalFresh
        certification, we collect the information required for your state work-hours form (legal name, mailing
        address, date of birth, contact phone, and case number). For some counties, we collect a screenshot from
        your benefits portal solely to confirm enrollment.</p>
      <p><strong>Task activity.</strong> Submissions you upload (text, photos, files), the checklist progress
        you record, and the active-time signals captured during a task session (start/stop, idle markers, and,
        for tasks that require it, device-reported location at the moment of capture).</p>
      <p><strong>Device and log data.</strong> Standard server logs (IP address, user agent, timestamps) and a
        device fingerprint used to detect duplicate or fraudulent accounts.</p>
      <p><strong>Communications.</strong> Messages you send us, including through the contact form.</p>

      <h2 className="mt-8 text-xl font-semibold text-ink">2. How we use information</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Operate the platform, authenticate your account, and respond to you.</li>
        <li>Verify that submissions are genuine human work that meets the task rubric, including AI-assisted
          review of submission content.</li>
        <li>Produce the pre-filled state work-hours certification form you download.</li>
        <li>Generate the free public deliverables described for each task.</li>
        <li>Prevent fraud, enforce our Terms, and protect the integrity of certified hours.</li>
        <li>Comply with legal obligations.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-ink">3. Public deliverables and your submissions</h2>
      <p>
        Tended is built around a strict separation between personal data and public work product. Each task ships
        a free public dataset (typically under CC0). The public dataset is built only from the non-personal
        portions of submissions — it never includes your name, email, phone, address, case number, or any
        verification document. Photos that contain identifiable people are reviewed before any public release and
        may be redacted or withheld.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">4. Sharing</h2>
      <p>We share information only as follows:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Partner organization for your task.</strong> The nonprofit or public agency that hosts a task
          you complete sees your submission so they can review and certify the work.</li>
        <li><strong>Service providers.</strong> Authentication, hosting, file storage, and AI-assisted review
          providers process data on our behalf under contract.</li>
        <li><strong>You.</strong> The pre-filled work-hours form is delivered to <em>you</em>; you choose whether
          to upload it to your county benefits portal. Tended does not submit it for you.</li>
        <li><strong>Legal and safety.</strong> Where required by law or to protect rights, safety, or the
          integrity of the program.</li>
      </ul>
      <p><strong>We do not sell your personal information.</strong> We are not a data broker.</p>

      <h2 className="mt-8 text-xl font-semibold text-ink">5. AI processing</h2>
      <p>
        Submission text and uploaded media are sent to an AI provider to score the submission against the task
        rubric and flag likely fraud. We instruct providers not to retain or train on this content. You can
        choose not to include sensitive personal information in your submissions; the in-app guidance tells you
        what each task needs.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">6. Activity monitoring during tasks</h2>
      <p>
        While a task session is active, the platform records active-engagement signals (timer, idle detection,
        and for some tasks, device-reported location at the moment of a photo capture). This monitoring is
        task-bound: it only runs while a task session is open, and it exists to certify actual measured time.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">7. Retention</h2>
      <p>
        Account and certification records are retained while your account is active and for a reasonable period
        afterward to satisfy audit obligations tied to certified hours. Public deliverable records (with no
        personal data) are retained indefinitely. You can request deletion at any time (see Your choices below).
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">8. Security</h2>
      <p>
        We use encryption in transit and at rest, salted password hashing, application-layer encryption for
        sensitive PII fields, rate limiting, and audit logging. No system is perfectly secure; please use a
        strong unique password and notify us if you believe your account is compromised.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">9. Your choices</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Access and correction.</strong> View and update your profile in Settings.</li>
        <li><strong>Deletion.</strong> Request account deletion from Settings or by contacting us. Deletion
          removes your account record; non-personal contributions in the public deliverables are orphaned (the
          link to you is removed) rather than deleted, so the public work product survives.</li>
        <li><strong>Email.</strong> You can opt out of non-essential email at any time.</li>
        <li><strong>California residents.</strong> You may exercise applicable rights under California law by
          contacting us. As a nonprofit, certain CCPA/CPRA provisions may not apply, but we honor reasonable
          requests for access, correction, and deletion.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-ink">10. Children</h2>
      <p>Tended is not directed to children under 18 and we do not knowingly collect data from them.</p>

      <h2 className="mt-8 text-xl font-semibold text-ink">11. International users</h2>
      <p>
        Tended is operated from the United States and is intended for U.S. residents. If you access it from
        elsewhere, you consent to the processing of your information in the United States.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">12. Changes</h2>
      <p>
        We will post updates to this policy here and, for material changes, notify you in-app or by email.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">13. Contact</h2>
      <p>
        Privacy questions or requests: <a href="/contact" className="text-forest underline">contact us</a>.
      </p>
    </article>
  );
}

function Es() {
  return (
    <article className="prose prose-neutral max-w-none space-y-4 text-body">
      <h1 className="text-[32px] font-semibold leading-tight text-ink md:text-[40px]">Política de privacidad</h1>
      <p>
        Tended es operado por una organización sin fines de lucro 501(c)(3). Recopilamos solo lo necesario para
        coordinar el trabajo voluntario, certificar horas y producir los entregables públicos en los que confían
        nuestras organizaciones socias. Esta política explica qué recopilamos, cómo lo usamos, con quién lo
        compartimos y las opciones que tienes.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">1. Información que recopilamos</h2>
      <p><strong>Información de la cuenta.</strong> Cuando creas una cuenta, recopilamos tu nombre, correo y
        contraseña (almacenada solo como hash con sal mediante nuestro proveedor de autenticación). Si inicias
        sesión con Google, recibimos tu nombre, correo e imagen de perfil de Google.</p>
      <p><strong>Información de perfil y certificación.</strong> Si decides usar Tended para la certificación de
        SNAP/CalFresh, recopilamos la información necesaria para tu formulario estatal de horas de trabajo
        (nombre legal, dirección postal, fecha de nacimiento, teléfono de contacto y número de caso). Para
        algunos condados, recopilamos una captura de pantalla de tu portal de beneficios únicamente para
        confirmar la inscripción.</p>
      <p><strong>Actividad de tareas.</strong> Envíos que subes (texto, fotos, archivos), el progreso de la
        lista de verificación que registras y las señales de tiempo activo capturadas durante una sesión de
        tarea.</p>
      <p><strong>Datos del dispositivo y registros.</strong> Registros estándar del servidor (dirección IP,
        agente de usuario, marcas de tiempo) y una huella digital del dispositivo utilizada para detectar
        cuentas duplicadas o fraudulentas.</p>
      <p><strong>Comunicaciones.</strong> Los mensajes que nos envías, incluido a través del formulario de
        contacto.</p>

      <h2 className="mt-8 text-xl font-semibold text-ink">2. Cómo usamos la información</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li>Operar la plataforma, autenticar tu cuenta y responderte.</li>
        <li>Verificar que los envíos sean trabajo humano genuino que cumpla con la rúbrica de la tarea, incluida
          la revisión asistida por IA del contenido del envío.</li>
        <li>Producir el formulario estatal de horas de trabajo pre-llenado que descargas.</li>
        <li>Generar los entregables públicos gratuitos descritos para cada tarea.</li>
        <li>Prevenir fraudes, hacer cumplir nuestros Términos y proteger la integridad de las horas certificadas.</li>
        <li>Cumplir con las obligaciones legales.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-ink">3. Entregables públicos y tus envíos</h2>
      <p>
        Tended está construido sobre una separación estricta entre los datos personales y el producto del
        trabajo público. Cada tarea entrega un conjunto de datos público gratuito (normalmente bajo CC0). El
        conjunto de datos público se construye únicamente con las partes no personales de los envíos — nunca
        incluye tu nombre, correo, teléfono, dirección, número de caso ni ningún documento de verificación. Las
        fotos que contengan personas identificables se revisan antes de cualquier publicación pública y pueden
        ser redactadas o retenidas.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">4. Compartir</h2>
      <p>Compartimos información únicamente de las siguientes maneras:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Organización socia de tu tarea.</strong> La organización sin fines de lucro o la agencia
          pública que aloja una tarea que completas ve tu envío para poder revisar y certificar el trabajo.</li>
        <li><strong>Proveedores de servicios.</strong> Los proveedores de autenticación, alojamiento,
          almacenamiento de archivos y revisión asistida por IA procesan datos en nuestro nombre bajo contrato.</li>
        <li><strong>Tú.</strong> El formulario de horas de trabajo pre-llenado se te entrega a <em>ti</em>; tú
          decides si subirlo al portal de beneficios de tu condado. Tended no lo envía por ti.</li>
        <li><strong>Legal y seguridad.</strong> Cuando lo exija la ley o para proteger derechos, la seguridad o
          la integridad del programa.</li>
      </ul>
      <p><strong>No vendemos tu información personal.</strong> No somos un intermediario de datos.</p>

      <h2 className="mt-8 text-xl font-semibold text-ink">5. Procesamiento con IA</h2>
      <p>
        El texto y los medios subidos en los envíos se envían a un proveedor de IA para puntuar el envío frente
        a la rúbrica de la tarea y señalar posibles fraudes. Instruimos a los proveedores a no retener ni
        entrenar con este contenido. Puedes optar por no incluir información personal sensible en tus envíos;
        las indicaciones en la app te dicen qué necesita cada tarea.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">6. Monitoreo de actividad durante las tareas</h2>
      <p>
        Mientras una sesión de tarea está activa, la plataforma registra señales de participación activa
        (temporizador, detección de inactividad y, para algunas tareas, ubicación reportada por el dispositivo
        en el momento de una captura). Este monitoreo está vinculado a la tarea: solo se ejecuta mientras una
        sesión está abierta y existe para certificar el tiempo realmente medido.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">7. Retención</h2>
      <p>
        Los registros de cuentas y certificaciones se conservan mientras tu cuenta está activa y por un período
        razonable después para cumplir con las obligaciones de auditoría relacionadas con las horas
        certificadas. Los registros de entregables públicos (sin datos personales) se conservan indefinidamente.
        Puedes solicitar la eliminación en cualquier momento (ver Tus opciones más abajo).
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">8. Seguridad</h2>
      <p>
        Usamos cifrado en tránsito y en reposo, hash de contraseñas con sal, cifrado a nivel de aplicación para
        campos PII sensibles, limitación de tasa y registros de auditoría. Ningún sistema es perfectamente
        seguro; usa una contraseña única y fuerte y notifícanos si crees que tu cuenta está comprometida.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">9. Tus opciones</h2>
      <ul className="list-disc space-y-1 pl-6">
        <li><strong>Acceso y corrección.</strong> Visualiza y actualiza tu perfil en Configuración.</li>
        <li><strong>Eliminación.</strong> Solicita la eliminación de la cuenta desde Configuración o
          contactándonos. La eliminación remueve tu registro de cuenta; las contribuciones no personales en los
          entregables públicos quedan huérfanas (se elimina el vínculo contigo) en lugar de eliminarse, para que
          el producto del trabajo público sobreviva.</li>
        <li><strong>Correo electrónico.</strong> Puedes optar por no recibir correos no esenciales en cualquier
          momento.</li>
        <li><strong>Residentes de California.</strong> Puedes ejercer los derechos aplicables bajo la ley de
          California contactándonos. Como organización sin fines de lucro, ciertas disposiciones de CCPA/CPRA
          pueden no aplicar, pero atendemos solicitudes razonables de acceso, corrección y eliminación.</li>
      </ul>

      <h2 className="mt-8 text-xl font-semibold text-ink">10. Menores</h2>
      <p>Tended no está dirigido a menores de 18 años y no recopilamos datos de ellos a sabiendas.</p>

      <h2 className="mt-8 text-xl font-semibold text-ink">11. Usuarios internacionales</h2>
      <p>
        Tended es operado desde los Estados Unidos y está destinado a residentes de los EE. UU. Si accedes desde
        otro lugar, consientes el procesamiento de tu información en los Estados Unidos.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">12. Cambios</h2>
      <p>
        Publicaremos las actualizaciones de esta política aquí y, para cambios materiales, te lo notificaremos
        en la aplicación o por correo electrónico.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">13. Contacto</h2>
      <p>
        Preguntas o solicitudes de privacidad: <a href="/contact" className="text-forest underline">contáctanos</a>.
      </p>
    </article>
  );
}
