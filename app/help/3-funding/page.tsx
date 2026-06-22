import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Who funds Tended — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(3, locale);
  const title = locale === "es" ? "Quién financia Tended" : "Who funds Tended";

  return (
    <ArticleShell number={3} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>Tended se financia con subvenciones y donaciones. Fundaciones, particulares y filantropía corporativa. El producto del trabajo que producen los voluntarios se distribuye gratis a la agencia socia, a la organización sin fines de lucro socia o a la comunidad. Tended no vende datos, entregables ni investigación.</p>

          <h2>Por qué importa aquí la estructura de financiación</h2>
          <p>Tended firma el formulario estatal de verificación. Eso significa que Tended es responsable de la integridad de cada certificación. Un modelo de financiación que pagara a Tended por cada beneficiario certificado le daría al certificador un incentivo financiero para maximizar lo que certifica. Ese es el conflicto que evita esta estructura.</p>

          <h2>Qué aceptamos</h2>
          <p>Subvenciones de fundaciones, donaciones individuales, filantropía corporativa (incluida la de empresas con un interés comercial en el acceso a alimentos y el bienestar comunitario), y alianzas con agencias en las que la agencia solicita trabajo cívico y lo financia mediante subvención o patrocinio.</p>

          <h2>Qué no aceptamos</h2>
          <p>Financiación condicionada a, o cobrada por, beneficiario certificado o resultado de inscripción. Pago por el producto del trabajo voluntario. Financiación vinculada a cabildeo legislativo o trabajo político partidista.</p>

          <h2>Gobernanza</h2>
          <p>La función de certificación está separada de la recaudación de fondos. Los financiadores no influyen en qué tareas existen, cómo se miden las horas o quién es certificado. Los financiadores principales se divulgan. La junta directiva supervisa la función de certificación.</p>

          <h2>Cabildeo</h2>
          <p>Una 501(c)(3) no puede hacer del cabildeo una parte sustancial de sus actividades (IRC §501(c)(3); §501(h) lo limita). Tended no lo hace.</p>
          <hr />
          <p><em>Ver también: ¿Qué es Tended?, Cómo verificamos las horas de voluntariado.</em></p>
        </>
      ) : (
        <>
          <p>Tended is funded by grants and donations. Foundations, individuals, and corporate philanthropy. The work product volunteers produce is distributed free to the partner agency, the partner nonprofit, or the community. Tended does not sell data, deliverables, or research.</p>

          <h2>Why the funding structure matters here</h2>
          <p>Tended signs the state verification form. That means Tended is accountable for the integrity of each certification. A funding model that paid Tended per certified recipient would give the certifier a financial incentive to maximize what it certifies. That is the conflict the structure avoids.</p>

          <h2>What we accept</h2>
          <p>Foundation grants, individual donations, corporate philanthropy (including from companies with a commercial interest in food access and community well-being), and agency partnerships where the agency requests civic work and funds it via grant or sponsorship.</p>

          <h2>What we don&apos;t accept</h2>
          <p>Funding conditioned on, or priced per, certified recipient or enrollment outcome. Payment for the volunteer work product. Funding tied to legislative advocacy or partisan political work.</p>

          <h2>Governance</h2>
          <p>The certification function is walled off from fundraising. Funders do not influence which tasks exist, how hours are measured, or who is certified. Major funders are disclosed. The board oversees the certification function.</p>

          <h2>Lobbying</h2>
          <p>A 501(c)(3) cannot make lobbying a substantial part of its activities (IRC §501(c)(3); §501(h) caps it). Tended does not.</p>
          <hr />
          <p><em>See also: What is Tended?, How we verify volunteer hours.</em></p>
        </>
      )}
    </ArticleShell>
  );
}
