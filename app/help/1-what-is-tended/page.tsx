import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "What is Tended? — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(1, locale);
  const title = locale === "es" ? "¿Qué es Tended?" : "What is Tended?";

  return (
    <ArticleShell number={1} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>
            Tended es una organización sin fines de lucro que gestiona una plataforma de voluntariado cívico en línea. Las personas se inscriben, completan tareas que producen trabajo real de beneficio público, y el tiempo que dedican es verificado y certificado por Tended. Para las personas que reciben CalFresh o SNAP y están sujetas al requisito de trabajo, esas horas certificadas cuentan para las 80 horas al mes (o, en Nueva York, el total más bajo basado en la fórmula del estado).
          </p>
          <p>
            Las tareas son reales. Los voluntarios documentan el acceso a alimentos en tiendas locales, revisan traducciones automáticas de materiales de agencias públicas, mapean aceras y rampas de acceso, transcriben archivos públicos y contribuyen a proyectos de investigación comunitaria que las organizaciones socias realmente usan.
          </p>

          <h2>Algunas cosas que queremos dejar claras</h2>
          <p>Tended es una organización benéfica pública 501(c)(3), financiada con subvenciones y donaciones.</p>
          <p>Tended no vende el trabajo que producen los voluntarios. Los resultados se distribuyen gratis a la agencia socia, a las organizaciones sin fines de lucro socias o a la comunidad.</p>
          <p>A los voluntarios no se les paga. El beneficio de SNAP que recibe un participante es un derecho del estado, no un pago de Tended.</p>
          <p>Tended firma la sección de la organización del formulario de verificación de horas que acepta tu estado, como representante autorizado de la organización donde se realizó el voluntariado. La firma se basa en los registros de la plataforma de Tended.</p>
          <p>Tended no es un bufete de abogados, y nada en este sitio constituye asesoría legal. Si tus beneficios están en duda, comunícate con un abogado de asistencia legal de SNAP.</p>

          <h2>Por qué existe esto</h2>
          <p>
            Los requisitos federales de trabajo se ampliaron en 2025. Muchas personas que ahora están sujetas a ellos no pueden llegar fácilmente a los sitios tradicionales de voluntariado presencial por motivos de discapacidad, responsabilidades de cuidado, transporte o disponibilidad local. Mientras tanto, las agencias públicas y las organizaciones comunitarias tienen necesidades no cubiertas de datos cívicos, revisión de traducciones y otro trabajo producido por voluntarios.
          </p>
          <p>
            Tended conecta esos dos hechos. El modelo es trabajo remoto que las agencias públicas realmente usan, verificado rigurosamente y certificado en el formulario estándar del estado.
          </p>
          <hr />
          <p><em>Ver también: Cómo funciona la plataforma, Quién financia Tended, Qué cuenta como horas de voluntariado para SNAP.</em></p>
        </>
      ) : (
        <>
          <p>
            Tended is a nonprofit that runs an online civic-volunteering platform. People sign up, complete tasks that produce real public-benefit work, and the time they spend is verified and certified by Tended. For people receiving CalFresh or SNAP who are subject to the work requirement, those certified hours count toward the 80 hours per month (or, in New York, the state&apos;s lower formula-based total).
          </p>
          <p>
            The tasks are real. Volunteers document food access at local stores, review machine translations of public-agency materials, map sidewalks and curb ramps, transcribe public archives, and contribute to community-research projects partner organizations actually use.
          </p>

          <h2>A few things to be clear about</h2>
          <p>Tended is a 501(c)(3) public charity, funded by grants and donations.</p>
          <p>Tended does not sell the work volunteers produce. Outputs are distributed free to the partner agency, partner nonprofits, or the community.</p>
          <p>Volunteers are not paid. The SNAP benefit a participant receives is a state entitlement, not payment from Tended.</p>
          <p>Tended signs the organization section of the work-hours verification form your state accepts, as the authorized representative of the organization where the volunteering happened. The signature is based on Tended&apos;s platform records.</p>
          <p>Tended is not a law firm, and nothing on this site is legal advice. If your benefits are in question, contact a SNAP legal-aid attorney.</p>

          <h2>Why this exists</h2>
          <p>
            Federal work requirements expanded in 2025. Many people now subject to them cannot easily reach traditional in-person volunteer sites because of disability, caregiving responsibilities, transportation, or local supply. Meanwhile, public agencies and community organizations have unmet needs for civic data, translation review, and other volunteer-produced work.
          </p>
          <p>
            Tended connects those two facts. The model is remote work that public agencies actually use, verified rigorously, and certified on the state&apos;s standard form.
          </p>
          <hr />
          <p><em>See also: How the platform works, Who funds Tended, What counts as SNAP volunteer hours.</em></p>
        </>
      )}
    </ArticleShell>
  );
}
