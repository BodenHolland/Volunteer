import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "How the platform works — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(2, locale);
  const title =
    locale === "es"
      ? "Cómo funciona la plataforma (para voluntarios)"
      : "How the platform works (for volunteers)";

  return (
    <ArticleShell number={2} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>Esto es lo que haces en Tended y lo que pasa con tu tiempo.</p>

          <h2>El ciclo</h2>
          <ol>
            <li>Exploras las tareas. Cada una te dice qué harás, qué entregable produces, quién lo usa y el tiempo que suele tomar.</li>
            <li>Completas la tarea en la aplicación. La plataforma registra tu tiempo activo en la tarea. El cronómetro se pausa cuando dejas de interactuar.</li>
            <li>Envías tu trabajo. Las comprobaciones automáticas confirman que el entregable está completo y es utilizable. La mayoría de los envíos se aprueban automáticamente. Los marcados reciben una revisión puntual de una persona.</li>
            <li>Se registran las horas. El número acreditado es tu participación medida, con un tope por tarea. (Ver Cómo verificamos las horas de voluntariado.)</li>
            <li>Al final del mes, Tended genera tu formulario estatal, pre-llenado con las horas que completaste y firmado por un representante autorizado.</li>
            <li>Subes el formulario a tu portal de beneficios. En California, es BenefitsCal. En Nueva York, ACCESS HRA. El condado lo procesa a partir de ahí.</li>
          </ol>

          <h2>Qué se certifica</h2>
          <p>El número en el formulario es tu participación real medida, hasta un tope por tarea. No es una estimación. No es una cifra fija. No es tiempo que la plataforma registró mientras estabas inactivo.</p>

          <h2>Qué puedes esperar</h2>
          <p>Las tareas no se agotan. La plataforma está diseñada de modo que más colaboradores siempre signifiquen más valor, y se abren tareas nuevas con regularidad.</p>
          <p>La mayoría de las tareas son remotas y se pueden hacer en un teléfono o computadora. Algunas son de campo (una visita a una tienda cercana, por ejemplo). Esas son opcionales.</p>
          <p>Puedes empezar y parar cuando elijas. Tended no te programa horarios, no fija cuotas ni te gestiona como empleado.</p>

          <h2>Una nota sobre las herramientas de IA</h2>
          <p>Puedes usar herramientas de IA cuando haces tareas. Tended no hace pruebas para detectar el uso de IA, y no usa IA para detectar IA. La pregunta que nos importa es si un esfuerzo genuino produjo una contribución utilizable, lo cual la validación ya comprueba.</p>
          <hr />
          <p><em>Si un condado cuestiona tus horas, ver Qué pasa si un condado cuestiona tus horas y Dónde conseguir ayuda legal.</em></p>
        </>
      ) : (
        <>
          <p>Here is what you do on Tended and what happens with your time.</p>

          <h2>The loop</h2>
          <ol>
            <li>You browse tasks. Each one tells you what you&apos;ll do, what deliverable you produce, who uses it, and the time it usually takes.</li>
            <li>You complete the task in the app. The platform records your active time on the task. The timer pauses when you stop interacting.</li>
            <li>You submit your work. Automated checks confirm the deliverable is complete and usable. Most submissions clear automatically. Flagged ones get a human spot-review.</li>
            <li>Hours are recorded. The credited number is your measured engagement, capped per task. (See How we verify volunteer hours.)</li>
            <li>At the end of the month, Tended generates your state form, pre-filled with the hours you completed and signed by an authorized representative.</li>
            <li>You upload the form to your benefits portal. In California, that&apos;s BenefitsCal. In New York, ACCESS HRA. The county processes it from there.</li>
          </ol>

          <h2>What gets certified</h2>
          <p>The number on the form is your actual measured engagement, up to a per-task cap. Not an estimate. Not a flat figure. Not time the platform recorded while you were idle.</p>

          <h2>What you can expect</h2>
          <p>Tasks don&apos;t run out. The platform is designed so that more contributors always mean more value, and new tasks open regularly.</p>
          <p>Most tasks are remote and can be done on a phone or computer. A few are field-based (a visit to a nearby store, for example). Those are optional.</p>
          <p>You can start and stop as you choose. Tended doesn&apos;t schedule you, set quotas, or manage you as an employee.</p>

          <h2>A note on AI tools</h2>
          <p>You can use AI tools when you do tasks. Tended does not test for AI use, and does not use AI to detect AI. The question we care about is whether genuine effort produced a usable contribution, which the validation already checks.</p>
          <hr />
          <p><em>If a county questions your hours, see What happens if a county questions your hours and Where to get legal help.</em></p>
        </>
      )}
    </ArticleShell>
  );
}
