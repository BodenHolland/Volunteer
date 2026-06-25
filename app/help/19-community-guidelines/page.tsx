import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale, getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Community guidelines — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { t } = await getDict();
  const { prev, next } = neighbors(19, locale);
  const title = locale === "es" ? "Normas de la comunidad" : t.helpCommunityGuidelines.title;

  return (
    <ArticleShell number={19} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>
            colift existe para producir trabajo real con valor público. Las normas a continuación describen lo que eso significa en la práctica, qué pasa cuando un envío no cumple el estándar, y por qué las apuestas son más altas de lo habitual.
          </p>

          <h2>Realiza el trabajo real</h2>
          <p>
            Cada tarea pide que hagas algo concreto: visitar una tienda y registrar precios, revisar un sitio web del gobierno en un dispositivo real, transcribir un documento público, documentar una acera. Tienes que hacerlo de verdad. No envíes datos de marcador de posición, no inventes observaciones ni rellenes campos sin haber completado el trabajo.
          </p>
          <p>
            La diferencia entre &ldquo;pasé por la tienda pero el artículo estaba agotado&rdquo; y &ldquo;inventé un precio&rdquo; importa. Lo primero es un hallazgo honesto. Lo segundo es una falsificación.
          </p>

          <h2>Envía tus propias fotos y evidencias</h2>
          <p>
            Las fotos y archivos adjuntos deben provenir de tu visita o sesión de trabajo real. No uses imágenes de internet, de visitas anteriores de otras personas ni de otras tareas. La plataforma compara las imágenes entrantes con las enviadas anteriormente usando una huella digital (hash SHA-256) y marca las coincidencias. Un duplicado detectado va directamente a revisión humana.
          </p>

          <h2>No inventes hallazgos</h2>
          <p>
            Si no pudiste completar un ítem —el artículo no tenía etiqueta de precio, la página que debías revisar estaba caída, el documento estaba ilegible— anótalo honestamente. Casi todas las especificaciones de tarea prevén este tipo de resultado. &ldquo;No disponible&rdquo; o &ldquo;no se pudo determinar&rdquo; es un hallazgo válido. Un número inventado no lo es.
          </p>

          <h2>Las herramientas de IA están permitidas, con límites</h2>
          <p>
            Puedes usar herramientas de IA durante el trabajo: buscar algo, resumir un documento largo, pulir la redacción de tus notas. Lo que no puedes hacer es usar IA para generar tu envío completo sin haber realizado la tarea tú mismo.
          </p>
          <p>
            La pregunta que hace el validador es: ¿participaste genuinamente en la tarea? Si la respuesta es sí y usaste IA como ayuda, no hay ningún problema. Si la respuesta es no —si le pediste a una IA que inventara los resultados y los enviaste como propios— eso es una falsificación.
          </p>

          <h2>Honestidad con el registro de tiempo</h2>
          <p>
            El temporizador del proyecto mide tu tiempo activo de trabajo. No lo dejes corriendo mientras no estás trabajando. Las sesiones que no se corresponden con el trabajo entregado —por ejemplo, varias horas registradas para un envío que solo podría tomar veinte minutos— se marcan por anomalía de velocidad y van a revisión humana.
          </p>
          <p>
            Solo se te acredita el tiempo activo real, con un tope máximo por tarea. Si tu tiempo medido es menor que el tope, eso es lo que recibes. No hay ganancia en dejar correr el reloj.
          </p>

          <h2>Un envío por instancia de tarea</h2>
          <p>
            Si cometiste un error o quieres actualizar tu trabajo, usa el flujo de &ldquo;necesita cambios&rdquo; cuando un revisor te lo indique, o comunícate con nosotros. No crees envíos duplicados para la misma instancia de tarea.
          </p>

          <h2>Qué pasa cuando un envío se marca</h2>
          <p>
            Los envíos marcados van a un revisor humano de la organización patrocinadora en lugar de aprobarse automáticamente. El revisor puede:
          </p>
          <ul>
            <li>
              <strong>Aprobar</strong> — las horas se acreditan (la cantidad puede reducirse si la calidad es parcial).
            </li>
            <li>
              <strong>Solicitar cambios</strong> — puedes revisar y volver a enviar.
            </li>
            <li>
              <strong>Rechazar</strong> — el trabajo rechazado recibe cero horas. No hay crédito parcial.
            </li>
          </ul>
          <p>
            Las violaciones repetidas pueden resultar en la suspensión de la cuenta.
          </p>

          <h2>Por qué las apuestas son más altas de lo habitual</h2>
          <p>
            Las horas certificadas aparecen en el Formulario CF 888 o en documentos equivalentes, que son declaraciones legales formales. La atestación falsa en documentos de beneficios federales conlleva exposición bajo 7 U.S.C. §2024 y 18 U.S.C. §1001 (declaraciones falsas ante el gobierno federal). Esto no es solo una cuestión de plataforma: es una cuestión de registro legal. No pongas eso en riesgo.
          </p>
          <p>
            colift no infla horas, no redondea hacia arriba ni certifica más de lo que se midió. La misma disciplina aplica para los voluntarios.
          </p>

          <hr />
          <p>
            <em>Ver también:</em>{" "}
            <a href="/help/8-verify">Cómo verificamos las horas de voluntariado</a>{" "}
            y{" "}
            <a href="/help/20-contact-bug">Reportar un error o contactarnos</a>.
          </p>
        </>
      ) : (
        <>
          <p>{t.helpCommunityGuidelines.intro}</p>

          <h2>{t.helpCommunityGuidelines.doRealWorkHeading}</h2>
          <p>{t.helpCommunityGuidelines.doRealWorkPara1}</p>
          <p>{t.helpCommunityGuidelines.doRealWorkPara2}</p>

          <h2>{t.helpCommunityGuidelines.ownPhotosHeading}</h2>
          <p>{t.helpCommunityGuidelines.ownPhotosPara}</p>

          <h2>{t.helpCommunityGuidelines.noFabricateHeading}</h2>
          <p>{t.helpCommunityGuidelines.noFabricatePara}</p>

          <h2>{t.helpCommunityGuidelines.aiToolsHeading}</h2>
          <p>{t.helpCommunityGuidelines.aiToolsPara1}</p>
          <p>{t.helpCommunityGuidelines.aiToolsPara2}</p>

          <h2>{t.helpCommunityGuidelines.timeLogHeading}</h2>
          <p>{t.helpCommunityGuidelines.timeLogPara1}</p>
          <p>{t.helpCommunityGuidelines.timeLogPara2}</p>

          <h2>{t.helpCommunityGuidelines.oneSubmissionHeading}</h2>
          <p>{t.helpCommunityGuidelines.oneSubmissionPara}</p>

          <h2>{t.helpCommunityGuidelines.flaggedHeading}</h2>
          <p>{t.helpCommunityGuidelines.flaggedPara}</p>
          <ul>
            <li>
              <strong>{t.helpCommunityGuidelines.flaggedApprove}</strong> &mdash; {t.helpCommunityGuidelines.flaggedApproveDetail}
            </li>
            <li>
              <strong>{t.helpCommunityGuidelines.flaggedChanges}</strong> &mdash; {t.helpCommunityGuidelines.flaggedChangesDetail}
            </li>
            <li>
              <strong>{t.helpCommunityGuidelines.flaggedReject}</strong> &mdash; {t.helpCommunityGuidelines.flaggedRejectDetail}
            </li>
          </ul>
          <p>{t.helpCommunityGuidelines.flaggedViolations}</p>

          <h2>{t.helpCommunityGuidelines.stakesHeading}</h2>
          <p>{t.helpCommunityGuidelines.stakesPara1}</p>
          <p>{t.helpCommunityGuidelines.stakesPara2}</p>

          <hr />
          <p>
            <em>{t.helpCommunityGuidelines.seeAlso}</em>{" "}
            <a href="/help/8-verify">{t.helpCommunityGuidelines.seeAlsoVerify}</a>{" "}
            and{" "}
            <a href="/help/20-contact-bug">{t.helpCommunityGuidelines.seeAlsoContact}</a>.
          </p>
        </>
      )}
    </ArticleShell>
  );
}
