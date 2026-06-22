import { ArticleShell } from "../_components/article-shell";
import { Placeholder } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Audit & methodology ledger — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(13);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: "Para trabajadores sociales: una metodología en una página" } : undefined;
    const nextEs = next ? { ...next, title: "Qué pasa si un condado cuestiona tus horas" } : undefined;
    return (
      <ArticleShell number={13} title="Registro de auditoría y metodología" prev={prevEs} next={nextEs}>
        <p>Tended publica un registro de metodología abierto para que los voluntarios, los trabajadores sociales, los socios, los financiadores y los auditores puedan ver cómo verificamos las horas de voluntariado y cómo ha evolucionado la metodología.</p>

        <h2>Qué hay en el registro</h2>
        <p>La versión vigente de la metodología de verificación, incluidos los criterios de validación por tarea.</p>
        <p>Los límites actuales por tarea (Tiempo Máximo Permitido, o MAT) para cada tarea activa, con un resumen de los datos de calibración subyacentes.</p>
        <p>El registro de cambios de calibración. Cada cambio en un límite o en la metodología, con la fecha y el motivo.</p>
        <p>Estadísticas agregadas de envíos, anonimizadas. Total de envíos, tasas de aprobación/rechazo de la validación, tasas de marcado y de revisión puntual. Ningún registro individual. Ningún dato personal.</p>
        <p>La lista de representantes autorizados. Nombres, cargos y la fecha de designación por la junta.</p>
        <p>La política de conflictos de interés y el cortafuegos de la función de certificación.</p>

        <h2>Qué no hay en el registro</h2>
        <p>Información sobre beneficiarios específicos. Los nombres, números de caso, recuentos de horas y el estatus de beneficiario de SNAP no se divulgan. La información de los beneficiarios está protegida bajo 7 CFR §272.1(c) y las reglas estatales equivalentes de salvaguarda.</p>
        <p>Datos específicos de voluntarios más allá de lo necesario para las estadísticas agregadas.</p>

        <h2>Por qué</h2>
        <p>La transparencia es la defensa ante una auditoría. Un revisor que pregunte cómo certificó Tended un conjunto de horas obtiene una respuesta completa sin presentar una solicitud.</p>

        <h2>Acceso</h2>
        <p>El registro está disponible en <Placeholder>[URL del registro]</Placeholder> y está enlazado desde el código QR en el certificado de participante que Tended emite junto con cada CF 888.</p>

        <h2>Para revisiones formales</h2>
        <p>Los revisores estatales (CDSS, OTDA) y federales (FNS) pueden solicitar una extracción formal de registros, que incluye los registros de validación subyacentes y la base de certificación por beneficiario, sujeto a las salvaguardas aplicables. Contacto: <Placeholder>[correo de contacto]</Placeholder>.</p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={13} title="Audit & methodology ledger" prev={prev} next={next}>
      <p>Tended publishes an open methodology ledger so volunteers, caseworkers, partners, funders, and auditors can see how we verify volunteer hours and how the methodology has evolved.</p>

      <h2>What&apos;s in the ledger</h2>
      <p>The live version of the verification methodology, including the per-task validation criteria.</p>
      <p>Current per-task caps (Maximum Allowable Time, or MAT) for every active task, with a summary of the underlying calibration data.</p>
      <p>The calibration changelog. Every change to a cap or to the methodology, with the date and the reason.</p>
      <p>Aggregate submission statistics, anonymized. Total submissions, validation pass/fail rates, flag and spot-review rates. No individual records. No PII.</p>
      <p>The authorized-representative roster. Names, titles, and the date of board designation.</p>
      <p>The conflict-of-interest policy and the certification-function firewall.</p>

      <h2>What&apos;s not in the ledger</h2>
      <p>Information about specific recipients. Names, case numbers, hour counts, and SNAP-recipient status are not disclosed. Beneficiary information is protected under 7 CFR §272.1(c) and equivalent state safeguarding rules.</p>
      <p>Volunteer-specific data beyond what&apos;s required for aggregate statistics.</p>

      <h2>Why</h2>
      <p>Transparency is the audit defense. A reviewer asking how Tended certified a set of hours gets a complete answer without filing a request.</p>

      <h2>Access</h2>
      <p>The ledger is available at <Placeholder>[ledger URL]</Placeholder> and is linked from the QR code on the participant certificate Tended issues alongside each CF 888.</p>

      <h2>For formal reviews</h2>
      <p>State (CDSS, OTDA) and federal (FNS) reviewers can request a formal records pull, including the underlying validation logs and the per-recipient certification basis, subject to applicable safeguards. Contact: <Placeholder>[contact email]</Placeholder>.</p>
    </ArticleShell>
  );
}
