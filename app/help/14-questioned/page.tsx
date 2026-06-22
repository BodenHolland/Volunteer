import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "What happens if a county questions your hours — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(14);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: "Registro de auditoría y metodología" } : undefined;
    const nextEs = next ? { ...next, title: "Dónde conseguir ayuda legal" } : undefined;
    return (
      <ArticleShell number={14} title="Qué pasa si un condado cuestiona tus horas" prev={prevEs} next={nextEs}>
        <p>Si un condado rechaza un CF 888 (o el formulario estatal equivalente) que Tended firmó, esto es lo que establece la ley. Es información objetiva, no asesoría ni orientación legal. Si tus beneficios están en juego, contacta a un abogado de asistencia legal especializado en SNAP.</p>

        <h2>Los beneficios de SNAP tienen protección de debido proceso</h2>
        <p>Los beneficios de SNAP son un derecho protegido bajo <em>Goldberg v. Kelly</em>, 397 U.S. 254 (1970). Un condado no puede reducir ni terminar tus beneficios sin un proceso formal.</p>

        <h2>1. Aviso de Acción</h2>
        <p>Si un condado toma una acción adversa en tu caso, tienes derecho a un Aviso de Acción por escrito que indique el motivo y tus derechos de apelación (7 CFR §273.13).</p>

        <h2>2. Audiencia imparcial estatal</h2>
        <p>Puedes solicitar una audiencia imparcial estatal ante un Juez de Derecho Administrativo (ALJ, por sus siglas en inglés). El ALJ no es un empleado del condado. Revisa el rechazo de forma independiente.</p>
        <ul>
          <li>Federal: 7 U.S.C. §2020(e)(10); 7 CFR §273.15.</li>
          <li>California: Cal. Welf. &amp; Inst. Code §10950 et seq.</li>
          <li>New York: solicita una audiencia imparcial a través de OTDA.</li>
        </ul>
        <p>En la audiencia, el ALJ examina si la verificación que respalda las horas fue adecuada. Los registros de Tended (registros de validación, datos de participación medida, la metodología publicada) son evidencia que respalda la audiencia.</p>

        <h2>3. Ayuda pagada mientras está pendiente</h2>
        <p>Si solicitas la audiencia imparcial antes de la fecha de entrada en vigor de la acción, tus beneficios generalmente continúan durante la apelación (7 CFR §273.15(k)). El momento importa. No te demores.</p>

        <h2>4. Revisión judicial</h2>
        <p>Si no prevaleces en la audiencia imparcial, puedes solicitar una revisión judicial. En California, es un mandato administrativo (writ of administrative mandamus) bajo Cal. Code Civ. Proc. §1094.5. Por lo general, primero debes agotar la audiencia imparcial.</p>

        <h2>Lo que Tended puede hacer</h2>
        <p>A petición, Tended puede proporcionar los registros que respaldan la certificación que firmamos: registros de validación, la metodología publicada y tus datos de participación medida. Esta es la evidencia en la que se basa una audiencia.</p>

        <h2>Lo que tú debes hacer</h2>
        <p>Lee el Aviso de Acción con atención. Anota cualquier plazo.</p>
        <p>Contacta de inmediato a un abogado de asistencia legal especializado en SNAP. (Consulta Dónde conseguir ayuda legal.)</p>
        <p>Guarda copias de todas las comunicaciones con el condado.</p>
        <p>Solicita la audiencia imparcial antes de la fecha de entrada en vigor de la acción si puedes, para que los beneficios sigan pagándose mientras está pendiente.</p>
        <hr />
        <p><em>No es asesoría legal. Tended no es un bufete de abogados.</em></p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={14} title="What happens if a county questions your hours" prev={prev} next={next}>
      <p>If a county rejects a CF 888 (or the equivalent state form) that Tended signed, here is what the law provides. This is factual information, not legal advice or coaching. If your benefits are at stake, contact a SNAP legal-aid attorney.</p>

      <h2>SNAP benefits have due-process protection</h2>
      <p>SNAP benefits are a protected entitlement under <em>Goldberg v. Kelly</em>, 397 U.S. 254 (1970). A county cannot reduce or terminate your benefits without a formal process.</p>

      <h2>1. Notice of Action</h2>
      <p>If a county takes adverse action on your case, you are entitled to a written Notice of Action stating the reason and your appeal rights (7 CFR §273.13).</p>

      <h2>2. State fair hearing</h2>
      <p>You can request a state fair hearing before an Administrative Law Judge (ALJ). The ALJ is not a county employee. They review the rejection independently.</p>
      <ul>
        <li>Federal: 7 U.S.C. §2020(e)(10); 7 CFR §273.15.</li>
        <li>California: Cal. Welf. &amp; Inst. Code §10950 et seq.</li>
        <li>New York: request a fair hearing through OTDA.</li>
      </ul>
      <p>At the hearing, the ALJ examines whether the verification supporting the hours was adequate. Tended&apos;s records (validation logs, measured engagement data, the published methodology) are evidence that supports the hearing.</p>

      <h2>3. Aid paid pending</h2>
      <p>If you request the fair hearing before the action&apos;s effective date, your benefits generally continue during the appeal (7 CFR §273.15(k)). Timing matters. Don&apos;t delay.</p>

      <h2>4. Judicial review</h2>
      <p>If you don&apos;t prevail at the fair hearing, you may seek judicial review. In California, that&apos;s a writ of administrative mandamus under Cal. Code Civ. Proc. §1094.5. You generally must exhaust the fair hearing first.</p>

      <h2>What Tended can do</h2>
      <p>On request, Tended can provide the records that support the certification we signed: validation logs, the published methodology, and your measured engagement data. This is the evidence a hearing relies on.</p>

      <h2>What you should do</h2>
      <p>Read the Notice of Action carefully. Note any deadlines.</p>
      <p>Contact a SNAP legal-aid attorney immediately. (See Where to get legal help.)</p>
      <p>Save copies of all communications with the county.</p>
      <p>Request the fair hearing before the action&apos;s effective date if you can, so benefits stay paid pending.</p>
      <hr />
      <p><em>Not legal advice. Tended is not a law firm.</em></p>
    </ArticleShell>
  );
}
