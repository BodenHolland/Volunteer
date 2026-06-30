import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Terms of Service — Colift" };
export const dynamic = "force-dynamic";

const EFFECTIVE = "June 27, 2026";

export default async function TermsPage() {
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
      <h1 className="text-[32px] font-semibold leading-tight text-ink md:text-[40px]">Terms of Service</h1>
      <p>
        These Terms govern your use of Colift (&quot;Colift,&quot; &quot;we,&quot; or &quot;us&quot;), a website and
        platform operated by a 501(c)(3) nonprofit organization that coordinates virtual volunteer work for
        nonprofits and public agencies. By creating an account or using Colift, you agree to these Terms.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">1. What Colift is</h2>
      <p>
        Colift lets volunteers select and complete civic tasks posted by partner nonprofits and public agencies.
        For volunteers who receive SNAP/CalFresh, certified hours can be reflected on a pre-filled state work-hours
        form that the volunteer downloads and submits to their county. Colift is not a government agency, does not
        determine benefit eligibility, and does not submit forms to any state or county on your behalf.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">2. Eligibility and accounts</h2>
      <p>
        You must be at least 18 years old (or the age of majority in your jurisdiction) to create an account. You
        agree to provide accurate information, keep your credentials confidential, and notify us promptly of any
        unauthorized use of your account. You are responsible for activity that occurs under your account.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">3. No payment; volunteer status</h2>
      <p>
        Colift does not pay you for your work, and the partner organization that hosts a task does not pay you for
        it. You participate as a volunteer. Hours certified through Colift represent the actual measured time you
        spent on a qualifying task — never inflated, never credited above your real time. Submitting false
        information in connection with a benefits-related certification may be a violation of state or federal law.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>submit content that is false, misleading, fraudulent, infringing, harassing, or unlawful;</li>
        <li>impersonate another person, or misrepresent your identity, location, or affiliation;</li>
        <li>use automated tools, bots, or AI to fabricate submissions or inflate hours;</li>
        <li>upload images or information about other identifiable people without their knowledge;</li>
        <li>attempt to interfere with the platform, its security, or other users; or</li>
        <li>use Colift to violate any applicable law or the terms of any benefits program.</li>
      </ul>
      <p>
        We may remove submissions, reject hours, suspend, or terminate accounts that violate these Terms or that
        we reasonably believe are being used to defraud a benefits program or a partner organization.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">5. Your content and the public deliverable</h2>
      <p>
        Colift is built on the principle that the work product is a public good. When you complete a task, you
        grant Colift and the hosting partner organization a worldwide, royalty-free, non-exclusive, perpetual
        license to use, reproduce, modify, aggregate, and publish the non-personal portions of your submission
        (including under a public license such as CC0) as part of the public deliverable described for that task.
        Personal information is held separately and is not part of the public deliverable. See the
        <a href="/help/11-privacy" className="text-forest underline"> Privacy Policy</a> for details.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">6. Hours certification</h2>
      <p>
        Hours appear as certified only after the partner organization reviews and approves the work, and only up
        to the actual measured time logged during the task. The certifying organization is solely responsible for
        its certification. Your county case worker decides whether the resulting work-hours form is accepted toward
        any benefits requirement. Colift makes no guarantee about acceptance or eligibility.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">7. Third-party services</h2>
      <p>
        Colift uses third-party providers for authentication, hosting, file storage, AI-assisted review of
        submissions, and similar functions. Your use of those features is also subject to those providers&apos;
        terms. We do not sell volunteer data.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">8. Disclaimers</h2>
      <p>
        Colift is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, express
        or implied, including warranties of merchantability, fitness for a particular purpose, and
        non-infringement. We do not warrant that the service will be uninterrupted, error-free, or secure, or that
        any certification will be accepted by any agency.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">9. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Colift and its directors, officers, employees, contractors, and
        partner organizations will not be liable for any indirect, incidental, special, consequential, or punitive
        damages, or for any loss of benefits, profits, data, or goodwill, arising out of or related to your use of
        the service. Our total liability for any claim arising out of or relating to the service is limited to one
        hundred U.S. dollars (USD $100).
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">10. Termination</h2>
      <p>
        You may stop using Colift at any time and may delete your account from your settings. We may suspend or
        terminate accounts that violate these Terms. Sections that by their nature should survive termination
        (including content license, disclaimers, limitation of liability, and governing law) will survive.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">11. Changes</h2>
      <p>
        We may update these Terms from time to time. If we make material changes, we will notify you in-app or by
        email. Continued use after the changes take effect constitutes your acceptance of the updated Terms.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">12. Governing law</h2>
      <p>
        These Terms are governed by the laws of the State of California, without regard to its conflict-of-laws
        principles. Venue for any dispute is the state and federal courts located in San Francisco County,
        California.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">13. Contact</h2>
      <p>
        Questions about these Terms: <a href="/contact" className="text-forest underline">contact us</a>.
      </p>
    </article>
  );
}

function Es() {
  return (
    <article className="prose prose-neutral max-w-none space-y-4 text-body">
      <h1 className="text-[32px] font-semibold leading-tight text-ink md:text-[40px]">Términos del servicio</h1>
      <p>
        Estos Términos rigen tu uso de Colift (&quot;Colift,&quot; &quot;nosotros&quot;), un sitio web y plataforma
        operados por una organización sin fines de lucro 501(c)(3) que coordina trabajo voluntario virtual para
        organizaciones sin fines de lucro y agencias públicas. Al crear una cuenta o usar Colift, aceptas estos
        Términos.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">1. Qué es Colift</h2>
      <p>
        Colift permite a los voluntarios seleccionar y completar tareas cívicas publicadas por organizaciones
        socias. Para voluntarios que reciben SNAP/CalFresh, las horas certificadas pueden reflejarse en un
        formulario estatal pre-llenado que el voluntario descarga y envía a su condado. Colift no es una agencia
        gubernamental, no determina la elegibilidad para beneficios y no envía formularios a ningún estado o
        condado en tu nombre.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">2. Elegibilidad y cuentas</h2>
      <p>
        Debes tener al menos 18 años (o la mayoría de edad en tu jurisdicción) para crear una cuenta. Aceptas
        proporcionar información precisa, mantener tus credenciales confidenciales y notificarnos cualquier uso no
        autorizado de tu cuenta. Eres responsable de la actividad que ocurra bajo tu cuenta.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">3. Sin pago; condición de voluntario</h2>
      <p>
        Colift no te paga por tu trabajo, y la organización socia que aloja una tarea tampoco te paga por ella.
        Participas como voluntario. Las horas certificadas representan el tiempo real medido que dedicaste a una
        tarea calificada — nunca infladas, nunca acreditadas por encima de tu tiempo real. Enviar información
        falsa en relación con una certificación de beneficios puede ser una violación de la ley estatal o federal.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">4. Uso aceptable</h2>
      <p>Aceptas no:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>enviar contenido falso, engañoso, fraudulento, infractor, acosador o ilegal;</li>
        <li>suplantar a otra persona o tergiversar tu identidad, ubicación o afiliación;</li>
        <li>usar herramientas automatizadas, bots o IA para fabricar envíos o inflar horas;</li>
        <li>subir imágenes o información sobre otras personas identificables sin su conocimiento;</li>
        <li>intentar interferir con la plataforma, su seguridad u otros usuarios; o</li>
        <li>usar Colift para violar cualquier ley aplicable o los términos de un programa de beneficios.</li>
      </ul>
      <p>
        Podemos eliminar envíos, rechazar horas, suspender o cerrar cuentas que violen estos Términos o que
        razonablemente creamos que se están utilizando para defraudar a un programa de beneficios o a una
        organización socia.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">5. Tu contenido y el entregable público</h2>
      <p>
        Colift se basa en el principio de que el producto del trabajo es un bien público. Al completar una tarea,
        otorgas a Colift y a la organización socia anfitriona una licencia mundial, libre de regalías, no
        exclusiva y perpetua para usar, reproducir, modificar, agregar y publicar las partes no personales de tu
        envío (incluido bajo una licencia pública como CC0) como parte del entregable público descrito para esa
        tarea. La información personal se conserva por separado y no forma parte del entregable público. Consulta
        la <a href="/help/11-privacy" className="text-forest underline">Política de privacidad</a> para más detalles.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">6. Certificación de horas</h2>
      <p>
        Las horas aparecen como certificadas solo después de que la organización socia revise y apruebe el
        trabajo, y solo hasta el tiempo real medido registrado durante la tarea. La organización certificadora es
        la única responsable de su certificación. Tu trabajador del condado decide si el formulario de horas
        resultante se acepta para cualquier requisito de beneficios. Colift no garantiza la aceptación ni la
        elegibilidad.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">7. Servicios de terceros</h2>
      <p>
        Colift usa proveedores externos para autenticación, alojamiento, almacenamiento de archivos, revisión
        asistida por IA de los envíos y funciones similares. Tu uso de esas funciones también está sujeto a los
        términos de esos proveedores. No vendemos datos de voluntarios.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">8. Renuncias de garantía</h2>
      <p>
        Colift se proporciona &quot;tal cual&quot; y &quot;según disponibilidad,&quot; sin garantías de ningún
        tipo, expresas o implícitas. No garantizamos que el servicio sea ininterrumpido, libre de errores o
        seguro, ni que ninguna certificación sea aceptada por ninguna agencia.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">9. Limitación de responsabilidad</h2>
      <p>
        En la medida máxima permitida por la ley, Colift y sus directores, funcionarios, empleados, contratistas y
        organizaciones socias no serán responsables de daños indirectos, incidentales, especiales, consecuentes o
        punitivos, ni de pérdida de beneficios, ganancias, datos o reputación derivados o relacionados con tu uso
        del servicio. Nuestra responsabilidad total por cualquier reclamación se limita a cien dólares
        estadounidenses (USD $100).
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">10. Terminación</h2>
      <p>
        Puedes dejar de usar Colift en cualquier momento y eliminar tu cuenta desde la configuración. Podemos
        suspender o cerrar cuentas que violen estos Términos. Las secciones que por su naturaleza deban
        sobrevivir a la terminación (incluidas la licencia de contenido, las renuncias, la limitación de
        responsabilidad y la ley aplicable) sobrevivirán.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">11. Cambios</h2>
      <p>
        Podemos actualizar estos Términos de vez en cuando. Si hacemos cambios materiales, te lo notificaremos en
        la aplicación o por correo electrónico. El uso continuado después de que los cambios entren en vigor
        constituye tu aceptación de los Términos actualizados.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">12. Ley aplicable</h2>
      <p>
        Estos Términos se rigen por las leyes del Estado de California, sin tener en cuenta sus principios de
        conflicto de leyes. La jurisdicción para cualquier disputa son los tribunales estatales y federales
        ubicados en el Condado de San Francisco, California.
      </p>

      <h2 className="mt-8 text-xl font-semibold text-ink">13. Contacto</h2>
      <p>
        ¿Preguntas sobre estos Términos? <a href="/contact" className="text-forest underline">Contáctanos</a>.
      </p>
    </article>
  );
}
