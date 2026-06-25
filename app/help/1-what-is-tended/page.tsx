import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale, getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "What is colift? | Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { t } = await getDict();
  const { prev, next } = neighbors(1, locale);
  const title = locale === "es" ? "¿Qué es colift?" : t.helpWhatIsTended.title;

  return (
    <ArticleShell number={1} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>
            colift es una organización sin fines de lucro que gestiona una plataforma de voluntariado cívico en línea. Las personas se inscriben, completan tareas que producen trabajo real de beneficio público, y el tiempo que dedican es verificado y certificado por colift. Para las personas que reciben CalFresh o SNAP y están sujetas al requisito de trabajo, esas horas certificadas cuentan para las 80 horas al mes (o, en Nueva York, el total más bajo basado en la fórmula del estado).
          </p>
          <p>
            Las tareas son reales. Los voluntarios documentan el acceso a alimentos en tiendas locales, revisan traducciones automáticas de materiales de agencias públicas, mapean aceras y rampas de acceso, transcriben archivos públicos y contribuyen a proyectos de investigación comunitaria que las organizaciones socias realmente usan.
          </p>

          <h2>Algunas cosas que queremos dejar claras</h2>
          <p>colift es una organización benéfica pública 501(c)(3), financiada con subvenciones y donaciones.</p>
          <p>colift no vende el trabajo que producen los voluntarios. Los resultados se distribuyen gratis a la agencia socia, a las organizaciones sin fines de lucro socias o a la comunidad.</p>
          <p>A los voluntarios no se les paga. El beneficio de SNAP que recibe un participante es un derecho del estado, no un pago de colift.</p>
          <p>colift firma la sección de la organización del formulario de verificación de horas que acepta tu estado, como representante autorizado de la organización donde se realizó el voluntariado. La firma se basa en los registros de la plataforma de colift.</p>
          <p>colift no es un bufete de abogados, y nada en este sitio constituye asesoría legal. Si tus beneficios están en duda, comunícate con un abogado de asistencia legal de SNAP.</p>

          <h2>Por qué existe esto</h2>
          <p>
            Los requisitos federales de trabajo se ampliaron en 2025. Muchas personas que ahora están sujetas a ellos no pueden llegar fácilmente a los sitios tradicionales de voluntariado presencial por motivos de discapacidad, responsabilidades de cuidado, transporte o disponibilidad local. Mientras tanto, las agencias públicas y las organizaciones comunitarias tienen necesidades no cubiertas de datos cívicos, revisión de traducciones y otro trabajo producido por voluntarios.
          </p>
          <p>
            colift conecta esos dos hechos. El modelo es trabajo remoto que las agencias públicas realmente usan, verificado rigurosamente y certificado en el formulario estándar del estado.
          </p>
          <hr />
          <p><em>Ver también: Cómo funciona la plataforma, Quién financia colift, Qué cuenta como horas de voluntariado para SNAP.</em></p>
        </>
      ) : (
        <>
          <p>{t.helpWhatIsTended.intro}</p>
          <p>{t.helpWhatIsTended.tasksPara}</p>

          <h2>{t.helpWhatIsTended.clearHeading}</h2>
          <p>{t.helpWhatIsTended.clear0}</p>
          <p>{t.helpWhatIsTended.clear1}</p>
          <p>{t.helpWhatIsTended.clear2}</p>
          <p>{t.helpWhatIsTended.clear3}</p>
          <p>{t.helpWhatIsTended.clear4}</p>

          <h2>{t.helpWhatIsTended.whyHeading}</h2>
          <p>{t.helpWhatIsTended.why0}</p>
          <p>{t.helpWhatIsTended.why1}</p>
          <hr />
          <p><em>{t.helpWhatIsTended.seeAlso}</em></p>
        </>
      )}
    </ArticleShell>
  );
}
