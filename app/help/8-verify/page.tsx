import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "How we verify volunteer hours — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(8);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: "Qué NO cuenta" } : undefined;
    const nextEs = next ? { ...next, title: "Cómo calibramos los límites de horas" } : undefined;
    return (
      <ArticleShell number={8} starred title="Cómo verificamos las horas de voluntariado" prev={prevEs} next={nextEs}>
        <p>Un trabajador social o un juez de audiencia imparcial que pregunte &ldquo;¿con qué base certificó Tended estas horas?&rdquo; encuentra la respuesta aquí.</p>

        <h2>La regla</h2>
        <pre><code>{`horas certificadas = mín(participación activa medida, límite calibrado)
                  condicionado a que el entregable pase la validación por envío`}</code></pre>
        <p>Certificamos el tiempo real dedicado al trabajo, con un tope máximo calibrado empíricamente por tarea, solo cuando el entregable pasa la validación. No certificamos una estimación. No certificamos una cifra fija por tarea. No acreditamos tiempo cuando no hubo participación genuina.</p>

        <h2>Participación activa medida</h2>
        <p>La plataforma registra la participación activa durante cada sesión de tarea.</p>
        <p>Un temporizador de sesión activa corre mientras estás interactuando con la tarea. La detección de inactividad pausa el temporizador cuando dejas de interactuar. Un mínimo de participación impide que envíes antes de una participación genuina (un tiempo mínimo en las instrucciones, una interacción mínima con el formulario del entregable).</p>
        <p>Este es el registro principal del tiempo real dedicado. Es a partir de lo que firma el representante autorizado.</p>

        <h2>Autoatestación del voluntario</h2>
        <p>Al enviar, afirmas que realizaste personalmente el trabajo y que el tiempo registrado refleja tu esfuerzo genuino. Los términos de servicio le dan a Tended el derecho de validar, conservar registros y corregir o revertir las horas acreditadas si más adelante se descubre que un envío es falso.</p>

        <h2>El límite calibrado</h2>
        <p>Cada tarea tiene un Tiempo Máximo Permitido (MAT, por sus siglas en inglés). El límite se calibra según la mediana observada de sesiones reales que pasaron el control de calidad para esa tarea, y se recalibra trimestralmente. (Consulta Cómo calibramos los límites de horas para conocer la metodología.)</p>
        <p>El límite solo puede reducir una cifra acreditada. Si tu participación medida está por debajo del límite, eso es lo que se te acredita. Si está en el límite o por encima, recibes el límite.</p>

        <h2>Validación por envío</h2>
        <p>Cada envío pasa por controles automatizados antes de que se acredite cualquier hora:</p>
        <ul>
          <li>Integridad respecto a la especificación del entregable.</li>
          <li>Plausibilidad de los valores (rangos, geocódigos, fotos que se resuelven, fechas que tienen sentido).</li>
          <li>Detección de datos personales (PII) antes de distribuir cualquier resultado agregado.</li>
          <li>Antiduplicación frente a tus envíos anteriores y frente a otros envíos.</li>
          <li>Una señal de participación que coincide con el rango de tiempo dedicado a la tarea.</li>
        </ul>
        <p>Los envíos que no pasan la validación obtienen cero horas. Los envíos fuera del rango normal se marcan para una revisión humana puntual. El representante autorizado supervisa la función de certificación y audita lotes.</p>

        <h2>Lo que no hacemos</h2>
        <p>No comprobamos si usaste IA. Las herramientas de IA están permitidas. La detección de IA es poco fiable y no viene al caso.</p>
        <p>No acreditamos tiempo pasivo. Un temporizador abierto sin participación no registra nada útil.</p>
        <p>No inflamos las horas, no exageramos las estimaciones ni dimensionamos el contenido para alargar el reloj.</p>
        <p>No certificamos horas que excedan la participación medida.</p>

        <h2>El certificador</h2>
        <p>Un representante autorizado real, con nombre propio, designado por la junta, firma la Sección 2 del CF 888 con base en los registros anteriores. El representante supervisa la metodología y es independiente de las métricas de crecimiento y recaudación de fondos de la plataforma. (Consulta Quién certifica tus horas, y cómo.)</p>

        <h2>Metodología abierta</h2>
        <p>Esta metodología, los límites actuales por tarea y el registro de cambios de calibración están publicados. Cualquiera puede leerlos. (Consulta el Registro de auditoría y metodología.)</p>
        <hr />
        <p><em>No es asesoría legal.</em></p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={8} starred title="How we verify volunteer hours" prev={prev} next={next}>
      <p>A caseworker or fair-hearing judge asking &ldquo;on what basis did Tended certify these hours?&rdquo; gets the answer here.</p>

      <h2>The rule</h2>
      <pre><code>{`certified hours = min(measured active engagement, calibrated cap)
                  gated on the deliverable passing per-submission validation`}</code></pre>
      <p>We certify actual time spent on the work, capped at an empirically calibrated maximum per task, only when the deliverable passes validation. We don&apos;t certify an estimate. We don&apos;t certify a flat per-task figure. We don&apos;t credit time when there wasn&apos;t genuine engagement.</p>

      <h2>Measured active engagement</h2>
      <p>The platform records active engagement during each task session.</p>
      <p>An active-session timer runs while you are interacting with the task. Idle detection pauses the timer when you stop interacting. A minimum-engagement floor prevents you from submitting before genuine engagement (a minimum time on the briefing, a minimum interaction with the deliverable form).</p>
      <p>This is the primary record of actual time spent. It&apos;s what the authorized representative signs from.</p>

      <h2>Volunteer self-attestation</h2>
      <p>At submission, you affirm that you personally performed the work and the recorded time reflects your genuine effort. The terms of service give Tended the right to validate, retain records, and correct or reverse credited hours if a submission is later found false.</p>

      <h2>The calibrated cap</h2>
      <p>Every task has a Maximum Allowable Time (MAT). The cap is calibrated to the observed median of real, quality-passing sessions for that task and recalibrated quarterly. (See How we calibrate hour caps for the methodology.)</p>
      <p>The cap only ever pulls a credited number down. If measured engagement is below the cap, that&apos;s what you get credit for. If it&apos;s at or above the cap, you get the cap.</p>

      <h2>Per-submission validation</h2>
      <p>Each submission goes through automated checks before any hours are credited:</p>
      <ul>
        <li>Completeness against the deliverable spec.</li>
        <li>Plausibility of the values (ranges, geocodes, photos resolving, dates making sense).</li>
        <li>PII screening before any aggregate output is distributed.</li>
        <li>Anti-duplication against your prior submissions and against other submissions.</li>
        <li>An engagement signal that matches the time-on-task band.</li>
      </ul>
      <p>Submissions that fail validation earn zero hours. Submissions outside the normal band are flagged for human spot-review. The authorized representative oversees the certification function and audits batches.</p>

      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t test for AI use. AI tools are permitted. AI-detection is unreliable and beside the point.</p>
      <p>We don&apos;t credit passive time. An open timer with no engagement records nothing useful.</p>
      <p>We don&apos;t pad hours, inflate estimates, or size content to extend the clock.</p>
      <p>We don&apos;t certify hours that exceed measured engagement.</p>

      <h2>The certifier</h2>
      <p>A real, named authorized representative designated by the board signs CF 888 Section 2 based on the records above. The representative oversees the methodology and is independent of the platform&apos;s growth and fundraising metrics. (See Who certifies your hours, and how.)</p>

      <h2>Open methodology</h2>
      <p>This methodology, current per-task caps, and the calibration changelog are published. Anyone can read them. (See Audit &amp; methodology ledger.)</p>
      <hr />
      <p><em>Not legal advice.</em></p>
    </ArticleShell>
  );
}
