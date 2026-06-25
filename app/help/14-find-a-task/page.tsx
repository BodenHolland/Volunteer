import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "How to find and commit to a task — Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(14, locale);
  const title = locale === "es" ? "Cómo encontrar y comprometerte con una tarea" : t.helpFindATask.title;

  return (
    <ArticleShell number={14} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>
            El catálogo de tareas está en <strong>/app/tasks</strong>. Desde ahí puedes explorar las tareas disponibles, filtrarlas y comprometerte con la que quieras hacer.
          </p>

          <h2>Cómo filtrar el catálogo</h2>
          <p>Hay tres formas de acotar la lista:</p>
          <ol>
            <li>
              <strong>Filtro de ubicación.</strong> Filtra entre tareas remotas y tareas presenciales. La mayoría de las tareas son remotas y se pueden hacer desde un teléfono o computadora. Las tareas de campo (como visitar una tienda) son opcionales y se indican claramente.
            </li>
            <li>
              <strong>Filtro de categoría.</strong> Filtra por el tipo de tarea, por ejemplo auditoría de precios de alimentos, revisión de documentos gubernamentales, investigación de tarifas de ambulancias, y otras.
            </li>
            <li>
              <strong>Búsqueda por palabras clave.</strong> Busca por título de la tarea, descripción breve o nombre de la organización patrocinadora.
            </li>
          </ol>
          <p>Puedes combinar los tres filtros al mismo tiempo.</p>

          <h2>Qué muestra cada tarjeta de tarea</h2>
          <p>
            Cada tarjeta del catálogo muestra el título de la tarea, la organización patrocinadora, la categoría, el tipo de ubicación (remota o presencial) y, si aplica, la fecha en que cierra.
          </p>

          <h2>Antes de comprometerte</h2>
          <p>
            Haz clic en una tarjeta para ir a la página de detalle de la tarea. Ahí encontrarás las instrucciones completas, el tiempo estimado y el tope máximo de horas para esa tarea. Lee las instrucciones completas antes de comprometerte: el tope de horas es un límite, no la cantidad que se te acreditará. Solo se acredita el tiempo activo real que registres mientras trabajas.
          </p>

          <h2>Cómo comprometerte</h2>
          <ol>
            <li>Ve a <strong>/app/tasks</strong> y encuentra una tarea que quieras hacer.</li>
            <li>Haz clic en la tarjeta para abrir la página de detalle.</li>
            <li>Lee las instrucciones completas y confirma que entiendes los requisitos.</li>
            <li>Haz clic en el botón <strong>Comprometerse</strong>. Esto crea un registro en la plataforma y te redirige al centro de proyecto en <strong>/app/projects/[id]</strong>, donde realizarás el trabajo.</li>
          </ol>

          <h2>Después de comprometerte</h2>
          <p>
            La tarea aparece en la sección <strong>Proyectos</strong> de tu cuenta, en <strong>/app/projects</strong>. Solo puedes tener un proyecto activo por tarea a la vez. Si más adelante quisieras hacer la misma tarea nuevamente, tendrías que comprometerte de nuevo una vez que hayas completado la primera.
          </p>

          <hr />
          <p><em>Ver también: <a href="/help/15-complete-work">Cómo completar y enviar tu trabajo</a>.</em></p>
        </>
      ) : (
        <>
          <p>
            The task catalog is at <strong>/app/tasks</strong>. {t.helpFindATask.intro.replace("The task catalog is at /app/tasks. ", "")}
          </p>

          <h2>{t.helpFindATask.filterHeading}</h2>
          <p>{t.helpFindATask.filterIntro}</p>
          <ol>
            <li>
              <strong>{t.helpFindATask.filter0Label}</strong> {t.helpFindATask.filter0Body}
            </li>
            <li>
              <strong>{t.helpFindATask.filter1Label}</strong> {t.helpFindATask.filter1Body}
            </li>
            <li>
              <strong>{t.helpFindATask.filter2Label}</strong> {t.helpFindATask.filter2Body}
            </li>
          </ol>
          <p>{t.helpFindATask.filterCombine}</p>

          <h2>{t.helpFindATask.cardHeading}</h2>
          <p>{t.helpFindATask.cardBody}</p>

          <h2>{t.helpFindATask.beforeCommitHeading}</h2>
          <p>{t.helpFindATask.beforeCommitBody}</p>

          <h2>{t.helpFindATask.howToCommitHeading}</h2>
          <ol>
            <li>Go to <strong>/app/tasks</strong> and find a task you want to do.</li>
            <li>{t.helpFindATask.howToCommit1}</li>
            <li>{t.helpFindATask.howToCommit2}</li>
            <li>Click the <strong>{t.helpFindATask.howToCommit3CommitLabel}</strong> button. This creates a record on the platform and redirects you to the project hub at <strong>/app/projects/[id]</strong>, where the actual work happens.</li>
          </ol>

          <h2>{t.helpFindATask.afterCommitHeading}</h2>
          <p>
            The task appears in the <strong>{t.helpFindATask.afterCommitProjectsLabel}</strong> section of your account at <strong>/app/projects</strong>. You can only have one active project per task at a time. If you want to do the same task again later, you&apos;ll commit to a new instance once you&apos;ve completed the first.
          </p>

          <hr />
          <p><em>{t.helpFindATask.seeAlso} <a href="/help/15-complete-work">{t.helpFindATask.seeAlsoLink}</a>.</em></p>
        </>
      )}
    </ArticleShell>
  );
}
