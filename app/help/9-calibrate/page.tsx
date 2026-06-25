import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "How we calibrate hour caps | Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(9);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: "Cómo verificamos las horas de voluntariado" } : undefined;
    const nextEs = next ? { ...next, title: "Quién certifica tus horas, y cómo" } : undefined;
    return (
      <ArticleShell number={9} title="Cómo calibramos los límites de horas" prev={prevEs} next={nextEs}>
        <p>Cada tarea en colift tiene un Tiempo Máximo Permitido (MAT, por sus siglas en inglés). Así se fija el límite y así se mantiene honesto.</p>

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
    <ArticleShell number={9} title={t.helpCalibrate.title} prev={prev} next={next}>
      <p>{t.helpCalibrate.intro}</p>

      <h2>{t.helpCalibrate.standardHeading}</h2>
      <p>{t.helpCalibrate.standardPara}</p>
      <p>{t.helpCalibrate.processLabel}</p>
      <ol>
        <li>{t.helpCalibrate.step0}</li>
        <li>{t.helpCalibrate.step1}</li>
        <li>{t.helpCalibrate.step2}</li>
        <li>{t.helpCalibrate.step3}</li>
      </ol>

      <h2>{t.helpCalibrate.ceilingHeading}</h2>
      <p>{t.helpCalibrate.ceilingPara}</p>

      <h2>{t.helpCalibrate.whyHeading}</h2>
      <p>{t.helpCalibrate.whyPara1}</p>
      <p>{t.helpCalibrate.whyPara2}</p>
      <p>{t.helpCalibrate.whyPara3}</p>

      <h2>{t.helpCalibrate.dontHeading}</h2>
      <p>{t.helpCalibrate.dontPara1}</p>
      <p>{t.helpCalibrate.dontPara2}</p>
      <p>{t.helpCalibrate.dontPara3}</p>

      <h2>{t.helpCalibrate.transparencyHeading}</h2>
      <p>{t.helpCalibrate.transparencyPara}</p>
    </ArticleShell>
  );
}
