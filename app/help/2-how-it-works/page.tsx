import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "How the platform works — Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(2, locale);
  const title =
    locale === "es"
      ? "Cómo funciona la plataforma (para voluntarios)"
      : t.helpHowPlatformWorks.title;

  return (
    <ArticleShell number={2} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>Esto es lo que haces en colift y lo que pasa con tu tiempo.</p>

          <h2>El ciclo</h2>
          <ol>
            <li>Exploras las tareas. Cada una te dice qué harás, qué entregable produces, quién lo usa y el tiempo que suele tomar.</li>
            <li>Completas la tarea en la aplicación. La plataforma registra tu tiempo activo en la tarea. El cronómetro se pausa cuando dejas de interactuar.</li>
            <li>Envías tu trabajo. Las comprobaciones automáticas confirman que el entregable está completo y es utilizable. La mayoría de los envíos se aprueban automáticamente. Los marcados reciben una revisión puntual de una persona.</li>
            <li>Se registran las horas. El número acreditado es tu participación medida, con un tope por tarea. (Ver Cómo verificamos las horas de voluntariado.)</li>
            <li>Al final del mes, colift genera tu formulario estatal, pre-llenado con las horas que completaste y firmado por un representante autorizado.</li>
            <li>Subes el formulario a tu portal de beneficios. En California, es BenefitsCal. En Nueva York, ACCESS HRA. El condado lo procesa a partir de ahí.</li>
          </ol>

          <h2>Qué se certifica</h2>
          <p>El número en el formulario es tu participación real medida, hasta un tope por tarea. No es una estimación. No es una cifra fija. No es tiempo que la plataforma registró mientras estabas inactivo.</p>

          <h2>Qué puedes esperar</h2>
          <p>Las tareas no se agotan. La plataforma está diseñada de modo que más colaboradores siempre signifiquen más valor, y se abren tareas nuevas con regularidad.</p>
          <p>La mayoría de las tareas son remotas y se pueden hacer en un teléfono o computadora. Algunas son de campo (una visita a una tienda cercana, por ejemplo). Esas son opcionales.</p>
          <p>Puedes empezar y parar cuando elijas. colift no te programa horarios, no fija cuotas ni te gestiona como empleado.</p>

          <h2>Una nota sobre las herramientas de IA</h2>
          <p>Puedes usar herramientas de IA cuando haces tareas. colift no hace pruebas para detectar el uso de IA, y no usa IA para detectar IA. La pregunta que nos importa es si un esfuerzo genuino produjo una contribución utilizable, lo cual la validación ya comprueba.</p>
          <hr />
          <p><em>Si un condado cuestiona tus horas, ver Qué pasa si un condado cuestiona tus horas y Dónde conseguir ayuda legal.</em></p>
        </>
      ) : (
        <>
          <p>{t.helpHowPlatformWorks.intro}</p>

          <h2>{t.helpHowPlatformWorks.loopHeading}</h2>
          <ol>
            <li>{t.helpHowPlatformWorks.step0}</li>
            <li>{t.helpHowPlatformWorks.step1}</li>
            <li>{t.helpHowPlatformWorks.step2}</li>
            <li>{t.helpHowPlatformWorks.step3}</li>
            <li>{t.helpHowPlatformWorks.step4}</li>
            <li>{t.helpHowPlatformWorks.step5}</li>
          </ol>

          <h2>{t.helpHowPlatformWorks.certifiedHeading}</h2>
          <p>{t.helpHowPlatformWorks.certifiedBody}</p>

          <h2>{t.helpHowPlatformWorks.expectHeading}</h2>
          <p>{t.helpHowPlatformWorks.expectPara0}</p>
          <p>{t.helpHowPlatformWorks.expectPara1}</p>
          <p>{t.helpHowPlatformWorks.expectPara2}</p>

          <h2>{t.helpHowPlatformWorks.aiHeading}</h2>
          <p>{t.helpHowPlatformWorks.aiBody}</p>
          <hr />
          <p><em>{t.helpHowPlatformWorks.footer}</em></p>
        </>
      )}
    </ArticleShell>
  );
}
