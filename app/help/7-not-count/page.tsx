import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "What does NOT count — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(7, locale);
  const title = locale === "es" ? "Qué NO cuenta" : "What does NOT count";

  return (
    <ArticleShell number={7} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>Esto es lo que Tended no acreditará como horas de voluntariado, y por qué.</p>

          <h2>Tareas de autoayuda y de beneficio personal</h2>
          <p>Actualizar tu propio currículum. Construir tu LinkedIn. Llevar registro de tus propios hábitos. Fijar metas personales. Estas benefician al voluntario, no a la comunidad. El servicio voluntario/comunitario de SNAP tiene que ser servicio a los demás.</p>

          <h2>Encuestas pagadas o cualquier participación remunerada</h2>
          <p>La participación pagada en investigación es ingreso. Eso incumple el requisito de &ldquo;trabajo no remunerado&rdquo; bajo 7 CFR §273.24(a)(2)(iii), y puede afectar la elegibilidad para SNAP por sí solo. El efectivo, las tarjetas de regalo, las participaciones en rifas y los equivalentes en dinero cuentan todos como compensación.</p>

          <h2>Publicaciones en redes sociales y activismo personal</h2>
          <p>Los tuits, publicaciones y compartidos en tus propias cuentas son acción personal. El producto del trabajo no llega a la organización. No hay un entregable que Tended pueda usar.</p>

          <h2>Educación y capacitación que recibes</h2>
          <p>Asistir a un taller, completar un curso, ver un video de capacitación. Estos pertenecen a la vía de Empleo y Capacitación (E&amp;T) de SNAP, que es un contrato estatal aparte y un modelo aparte. Tended no opera actualmente en el carril de E&amp;T.</p>

          <h2>Cabildeo y trabajo político partidista</h2>
          <p>Abogar por legislación o candidatos específicos. Una 501(c)(3) no puede hacer del cabildeo una parte sustancial de sus actividades (IRC §501(c)(3); §501(h) lo limita). La educación cívica y la participación electoral no partidista están bien. El cabildeo y las campañas no.</p>

          <h2>Tiempo pasivo</h2>
          <p>Iniciar un cronómetro, dejar una pestaña abierta, dejar correr el reloj mientras haces otra cosa. El tiempo sin participación no es trabajo, y la detección de inactividad de la plataforma no lo acreditará.</p>

          <h2>Contenido inflado</h2>
          <p>No acreditamos tiempo de lectura diseñado para inflar el reloj, envíos idénticos repetidos ni contenido dimensionado para alargar una tarea. Las horas acreditadas equivalen a la participación real medida, con un tope por tarea.</p>

          <h2>Autodivulgación sin un uso real de investigación</h2>
          <p>Indicaciones genéricas de &ldquo;cuéntanos sobre ti&rdquo; sin un entregable nombrado. Estas incumplen las barreras de las tareas de encuesta. (Ver Encuestas y contribuciones de investigación comunitaria.)</p>

          <h2>Afirmaciones deliberadamente no verificables</h2>
          <p>Tareas diseñadas para que la afirmación no se pueda comprobar. Una tarea que no podemos verificar es una certificación de horas que no podemos firmar de buena fe.</p>

          <h2>Trabajo comercial disfrazado</h2>
          <p>Etiquetar datos para una startup con fines de lucro. Hacer tareas para un proveedor comercial. No es servicio benéfico a una organización que califica.</p>
          <hr />
          <p><em>Si quieres proponer un tipo de tarea, cada idea se compara con esta lista y con la prueba interna de calificación. No es asesoría legal.</em></p>
        </>
      ) : (
        <>
          <p>Here is what Tended won&apos;t credit as volunteer hours, and why.</p>

          <h2>Self-help and personal-benefit tasks</h2>
          <p>Updating your own resume. Building your LinkedIn. Tracking your own habits. Setting personal goals. These benefit the volunteer, not the community. SNAP volunteer/community service has to be service to others.</p>

          <h2>Paid surveys or any compensated participation</h2>
          <p>Paid research participation is income. That fails the &ldquo;unpaid work&rdquo; requirement under 7 CFR §273.24(a)(2)(iii), and can affect SNAP eligibility on its own. Cash, gift cards, raffle entries, and money-equivalents all count as compensation.</p>

          <h2>Social media posting and personal advocacy</h2>
          <p>Tweets, posts, and shares on your own accounts are personal action. The work product doesn&apos;t reach the organization. There&apos;s no deliverable Tended can use.</p>

          <h2>Education and training you receive</h2>
          <p>Attending a workshop, completing a course, watching a training video. These belong to the SNAP Employment &amp; Training (E&amp;T) pathway, which is a separate state contract and a separate model. Tended does not currently operate in the E&amp;T lane.</p>

          <h2>Lobbying and partisan political work</h2>
          <p>Advocating for specific legislation or candidates. A 501(c)(3) cannot make lobbying a substantial part of its activities (IRC §501(c)(3); §501(h) limits). Civic education and nonpartisan voter engagement are fine. Lobbying and campaigning are not.</p>

          <h2>Passive time</h2>
          <p>Starting a timer, leaving a tab open, letting the clock run while you do something else. Time without engagement is not work, and the platform&apos;s idle detection won&apos;t credit it.</p>

          <h2>Padded content</h2>
          <p>We don&apos;t credit reading time engineered to inflate the clock, repeated identical submissions, or content sized to extend a task. Credited hours equal actual measured engagement, capped per task.</p>

          <h2>Self-disclosure without a real research use</h2>
          <p>General &ldquo;tell us about yourself&rdquo; prompts with no named deliverable. These fail the survey-task gates. (See Surveys &amp; community-research contributions.)</p>

          <h2>Deliberately unverifiable claims</h2>
          <p>Tasks designed so the claim can&apos;t be checked. A task we can&apos;t verify is a work-hours certification we can&apos;t sign for in good faith.</p>

          <h2>Commercial labor in disguise</h2>
          <p>Labeling data for a for-profit startup. Doing tasks for a commercial vendor. Not charitable service to a qualifying organization.</p>
          <hr />
          <p><em>If you want to propose a task type, every idea gets checked against this list and against the internal qualification test. Not legal advice.</em></p>
        </>
      )}
    </ArticleShell>
  );
}
