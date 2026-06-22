import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Who certifies your hours — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(10);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: "Cómo calibramos los límites de horas" } : undefined;
    const nextEs = next ? { ...next, title: "Privacidad, datos personales y lo que publicamos" } : undefined;
    return (
      <ArticleShell number={10} title="Quién certifica tus horas, y cómo" prev={prevEs} next={nextEs}>
        <p>En el formulario de verificación de horas de California, el New York Monthly ABAWD Volunteer Participation Record y los formularios estatales equivalentes, la firma en la sección de la organización es lo que hace que el formulario sea válido. Aquí está quién firma, qué certifica y qué exige la ley.</p>

        <h2>Quién firma</h2>
        <p>Una persona real, con nombre propio, que es un representante autorizado de Tended. Por lo general, un directivo, empleado o agente designado por la junta. La junta designa formalmente a los representantes autorizados y documenta la delegación. &ldquo;Tended, Inc.&rdquo; no firma en abstracto. Un ser humano con nombre respalda cada certificación.</p>

        <h2>Lo que exige el formulario</h2>
        <p>El formulario verificado de California (rev. 5/25), sección de la organización:</p>
        <blockquote>
          <p>&ldquo;Para el mes de ______, certifico que la persona nombrada arriba hizo trabajo voluntario o servicio comunitario para la organización que represento durante ______ horas. La actividad de voluntariado es: ☐ Continua ☐ Una sola vez.&rdquo;</p>
        </blockquote>
        <p>Vale la pena señalar lo que el formulario no exige:</p>
        <ul>
          <li>No se imprime en el formulario ninguna declaración bajo pena de perjurio. (Las horas falsas a sabiendas conllevan de todos modos una exposición independiente por fraude bajo la ley federal y estatal. Lo tomamos en serio de todos modos.)</li>
          <li>No se exige observación ni supervisión del voluntario. Quien firma es &ldquo;un representante de la organización donde la persona hace trabajo voluntario.&rdquo; La ley no exige que el representante haya observado el trabajo.</li>
          <li>No hay campo de EIN. Un EIN puede aparecer en un certificado de participante por separado que Tended emite junto con el formulario, pero el documento operativo es la verificación de horas firmada.</li>
        </ul>

        <h2>Qué está certificando el representante</h2>
        <p>El representante certifica las horas de voluntariado realmente realizadas, que es la cifra que registra el sistema de verificación. (Consulta Cómo verificamos las horas de voluntariado.) La certificación se hace conforme a los registros, según la metodología documentada, no a partir de una observación personal. Este es el mismo patrón que usa un coordinador de un banco de alimentos cuando firma una hoja de registro sin haber observado cada minuto de cada turno.</p>

        <h2>Cómo se aplica la firma</h2>
        <p>Las firmas electrónicas son válidas bajo la ley federal (ESIGN Act, 15 U.S.C. §7001) y de California (UETA, Civ. Code §1633.1 et seq.). El formulario de California no tiene requisito de notarización. La plataforma puede aplicar automáticamente la firma electrónica del representante autorizado a los formularios generados a partir de registros que pasaron la validación.</p>
        <p>La firma automática cambia la mecánica, no la responsabilidad. El representante con nombre propio supervisa la metodología, toma muestras y audita lotes, y respalda cada formulario que lleva su firma.</p>

        <h2>Independencia de la recaudación de fondos y el crecimiento</h2>
        <p>La función de certificación está separada por política de las métricas de recaudación de fondos y de crecimiento. El papel del representante no se mide por cuántas certificaciones firma ni por cuántos beneficiarios están inscritos. (Consulta Quién financia Tended para conocer los detalles del cortafuegos de financiación.)</p>

        <h2>Lo que esto no es</h2>
        <p>No es Tended atestiguando la identidad del voluntario. El estado ya verificó la identidad a través de la inscripción en CalFresh. Tended atestigua el trabajo.</p>
        <p>No es una observación personal por parte de quien firma de cada hora. La ley no lo exige, y no lo representamos así.</p>
        <hr />
        <p><em>No es asesoría legal. Referencia: <a href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf" target="_blank" rel="noopener noreferrer">Formulario de verificación de California (CDSS)</a>.</em></p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={10} title="Who certifies your hours, and how" prev={prev} next={next}>
      <p>On California&apos;s work-hours verification form, the New York Monthly ABAWD Volunteer Participation Record, and equivalent state forms, the signature in the organization section is what makes the form valid. Here&apos;s who signs, what they certify, and what the law requires.</p>

      <h2>Who signs</h2>
      <p>A real, named individual who is an authorized representative of Tended. Usually an officer, employee, or board-designated agent. The board formally designates the authorized representative(s) and documents the delegation. &ldquo;Tended, Inc.&rdquo; doesn&apos;t sign in the abstract. A named human stands behind every certification.</p>

      <h2>What the form requires</h2>
      <p>California&apos;s verified form (rev. 5/25), organization section:</p>
      <blockquote>
        <p>&ldquo;For the month of ______, I certify that the person named above volunteered or performed community service for the organization I represent for ______ hours. The volunteer activity is: ☐ Ongoing ☐ One Time.&rdquo;</p>
      </blockquote>
      <p>What the form does not require is worth noting:</p>
      <ul>
        <li>No penalty-of-perjury jurat is printed on the form. (Knowingly false hours still carry separate fraud exposure under federal and state law. We take that seriously regardless.)</li>
        <li>No observation or supervision of the volunteer. The signer is &ldquo;a representative of the organization where the person volunteers.&rdquo; The law does not require the representative to have watched the work.</li>
        <li>No EIN field. An EIN may appear on a separate participant certificate Tended issues alongside the form, but the operative document is the signed verification.</li>
      </ul>

      <h2>What the representative is certifying</h2>
      <p>The representative certifies the actual volunteered hours, which is the number the verification system records. (See How we verify volunteer hours.) The certification is to the records, per the documented methodology, not from personal observation. This is the same pattern a food-bank coordinator uses when signing a sign-in sheet without having watched every shift minute.</p>

      <h2>How the signature is applied</h2>
      <p>E-signatures are valid under federal (ESIGN Act, 15 U.S.C. §7001) and California (UETA, Civ. Code §1633.1 et seq.) law. The California form has no notary requirement. The platform may apply the authorized representative&apos;s e-signature automatically to forms generated from records that have passed validation.</p>
      <p>Auto-signing changes the mechanics, not the accountability. The named representative oversees the methodology, samples and audits batches, and stands behind every form bearing their signature.</p>

      <h2>Independence from fundraising and growth</h2>
      <p>The certification function is walled off from fundraising and growth metrics by policy. The representative&apos;s role is not measured by how many certifications they sign or how many recipients are enrolled. (See Who funds Tended for the funding-firewall details.)</p>

      <h2>What this is not</h2>
      <p>It is not Tended attesting to the volunteer&apos;s identity. The state already verified identity through CalFresh enrollment. Tended attests to the work.</p>
      <p>It is not a personal observation by the signer of each hour. The law does not require that, and we don&apos;t represent it.</p>
      <hr />
      <p><em>Not legal advice. Reference: <a href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf" target="_blank" rel="noopener noreferrer">California verification form (CDSS)</a>.</em></p>
    </ArticleShell>
  );
}
