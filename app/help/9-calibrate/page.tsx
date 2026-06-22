import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "How we calibrate hour caps — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(9);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: "Cómo verificamos las horas de voluntariado" } : undefined;
    const nextEs = next ? { ...next, title: "Quién certifica tus horas, y cómo" } : undefined;
    return (
      <ArticleShell number={9} title="Cómo calibramos los límites de horas" prev={prevEs} next={nextEs}>
        <p>Cada tarea en Tended tiene un Tiempo Máximo Permitido (MAT, por sus siglas en inglés). Así se fija el límite y así se mantiene honesto.</p>

        <h2>El estándar</h2>
        <p>El límite se calibra según la mediana observada de sesiones reales de voluntariado que pasaron el control de calidad para esa tarea. No la intuición del fundador. No la suposición a priori de una IA. No una cifra diseñada para que sea más fácil alcanzar el requisito de un mes.</p>
        <p>El proceso:</p>
        <ol>
          <li>Establece un límite inicial a partir de una descomposición de la tarea. Carga de lectura (palabras divididas por la velocidad de lectura), elementos de entrada de datos, longitud del resultado, interacciones requeridas.</li>
          <li>Recopila los tiempos de participación realmente medidos de voluntarios reales que completaron la tarea y cuyo entregable pasó la validación.</li>
          <li>Fija el límite en o cerca de la mediana de esas sesiones que pasaron el control de calidad.</li>
          <li>Recalibra trimestralmente, con un registro de cambios por escrito.</li>
        </ol>

        <h2>El límite es un techo, no una meta</h2>
        <p>El límite solo puede reducir una cifra acreditada. Si terminas una tarea en menos del límite, se te acredita tu participación realmente medida. El límite existe para detectar valores atípicos, no para otorgarle a todos el máximo.</p>

        <h2>Por qué lo hacemos así</h2>
        <p>Es honesto. Certificamos el tiempo que los voluntarios reales dedicaron de verdad.</p>
        <p>Es defendible. Una metodología escrita y fechada, calibrada con datos reales de sesiones, es la respuesta más sólida para un revisor que pregunta cómo se fijó una cifra por tarea.</p>
        <p>Protege a todos. El voluntario no queda certificado por horas que no trabajó. El certificador no firma cifras infladas. La aceptación del condado depende de que los registros sean creíbles.</p>

        <h2>Lo que no hacemos</h2>
        <p>No &ldquo;estimamos por lo alto&rdquo; para ser generosos. La generosidad aquí sería una atestación falsa.</p>
        <p>No fijamos los límites como un múltiplo de una estimación (máx = 2× est). El límite es empírico.</p>
        <p>No dimensionamos el contenido de la tarea para alargar el límite.</p>

        <h2>Transparencia</h2>
        <p>El documento de metodología, los límites actuales y el registro de cambios están publicados. (Consulta el Registro de auditoría y metodología.)</p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={9} title="How we calibrate hour caps" prev={prev} next={next}>
      <p>Every task on Tended has a Maximum Allowable Time (MAT). This is how the cap gets set, and how it stays honest.</p>

      <h2>The standard</h2>
      <p>The cap is calibrated to the observed median of real, quality-passing volunteer sessions for that task. Not the founder&apos;s intuition. Not an AI&apos;s a priori guess. Not a number engineered to make a month&apos;s requirement easier to hit.</p>
      <p>The process:</p>
      <ol>
        <li>Seed an initial cap from a task decomposition. Reading load (words divided by reading speed), data-entry items, output length, required interactions.</li>
        <li>Collect actual measured engagement times from real volunteers who completed the task and whose deliverable passed validation.</li>
        <li>Set the cap at or near the median of those quality-passing sessions.</li>
        <li>Recalibrate quarterly, with a written changelog.</li>
      </ol>

      <h2>The cap is a ceiling, not a target</h2>
      <p>The cap can only pull a credited number down. If you finish a task in less than the cap, you get credit for your actual measured engagement. The cap exists to catch outliers, not to award everyone the maximum.</p>

      <h2>Why we do it this way</h2>
      <p>It is honest. We certify time that real volunteers actually spent.</p>
      <p>It is defensible. A written, dated methodology calibrated against real session data is the strongest answer to a reviewer asking how a per-task number was set.</p>
      <p>It protects everyone. The volunteer isn&apos;t certified for hours they didn&apos;t work. The certifier isn&apos;t signing inflated numbers. County acceptance depends on the records being credible.</p>

      <h2>What we don&apos;t do</h2>
      <p>We don&apos;t &ldquo;estimate on the high side&rdquo; to be generous. Generosity here would be false attestation.</p>
      <p>We don&apos;t set caps as a multiple of an estimate (max = 2× est). The cap is empirical.</p>
      <p>We don&apos;t size task content to extend the cap.</p>

      <h2>Transparency</h2>
      <p>The methodology document, current caps, and changelog are published. (See Audit &amp; methodology ledger.)</p>
    </ArticleShell>
  );
}
