import { ArticleShell } from "../_components/article-shell";
import { Placeholder } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";

export const metadata = { title: "Where to get legal help — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { prev, next } = neighbors(15);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: "Qué pasa si un condado cuestiona tus horas" } : undefined;
    return (
      <ArticleShell number={15} title="Dónde conseguir ayuda legal" prev={prevEs} next={next}>
        <p>Si tus beneficios de SNAP o CalFresh están en juego, contacta a un abogado de asistencia legal especializado en beneficios públicos. Esta es una lista de referencia, no una recomendación, y no es asesoría legal.</p>

        <h2>California</h2>
        <ul>
          <li>Legal Services of Northern California (LSNC). <a href="https://calfresh.guide/" target="_blank" rel="noopener noreferrer">calfresh.guide</a> para la guía y la admisión específicas de CalFresh.</li>
          <li>Western Center on Law &amp; Poverty. Política y defensa a nivel estatal sobre CalFresh/SNAP.</li>
          <li>Bay Area Legal Aid (BayLegal). Nueve condados del Área de la Bahía.</li>
          <li>Public Counsel. Los Ángeles.</li>
          <li>Legal Aid Foundation of Los Angeles (LAFLA). Condado de Los Ángeles.</li>
          <li>Inland Counties Legal Services (ICLS). Inland Empire.</li>
          <li>El ombudsperson del departamento de bienestar de tu condado, si existe uno.</li>
        </ul>

        <h2>New York</h2>
        <ul>
          <li>Legal Services NYC. <a href="https://www.legalservicesnyc.org/" target="_blank" rel="noopener noreferrer">legalservicesnyc.org</a>. En toda la ciudad.</li>
          <li>The Legal Aid Society. Ciudad de Nueva York. Práctica de beneficios y asistencia pública.</li>
          <li>LawHelpNY. <a href="https://www.lawhelpny.org/" target="_blank" rel="noopener noreferrer">lawhelpny.org</a>. Herramienta de búsqueda a nivel estatal.</li>
          <li>Empire Justice Center. Política y defensa a nivel estatal.</li>
          <li>New York Legal Assistance Group (NYLAG). NYC.</li>
        </ul>

        <h2>Nacional</h2>
        <ul>
          <li>Food Research &amp; Action Center (FRAC). <a href="https://frac.org/" target="_blank" rel="noopener noreferrer">frac.org</a>. Recurso nacional de política de SNAP.</li>
          <li>National Center for Law and Economic Justice. Centro nacional de derecho de beneficios públicos.</li>
        </ul>

        <h2>Lo que puede hacer un abogado de asistencia legal de SNAP</h2>
        <p>Revisar tu Aviso de Acción y evaluar tu caso. Ayudarte a solicitar a tiempo una audiencia imparcial estatal. Representarte en la audiencia, generalmente gratis. Asesorarte sobre si aplica la ayuda pagada mientras está pendiente y cómo preservarla. Asesorarte sobre la revisión judicial si es necesario.</p>

        <h2>Lo que Tended puede hacer</h2>
        <p>Proporcionar los registros de verificación que respaldan cualquier certificación de horas que firmamos. Tu abogado puede solicitarlos directamente. Contacto: <Placeholder>[correo de contacto]</Placeholder>.</p>
        <hr />
        <p><em>Tended no es un bufete de abogados. Esta lista es informativa. Puede no estar completa ni actualizada. Por favor verifica directamente los servicios y los horarios de admisión de cada organización.</em></p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={15} title="Where to get legal help" prev={prev} next={next}>
      <p>If your SNAP or CalFresh benefits are at stake, contact a legal-aid attorney who specializes in public benefits. This is a referral list, not a recommendation, and it is not legal advice.</p>

      <h2>California</h2>
      <ul>
        <li>Legal Services of Northern California (LSNC). <a href="https://calfresh.guide/" target="_blank" rel="noopener noreferrer">calfresh.guide</a> for the CalFresh-specific guide and intake.</li>
        <li>Western Center on Law &amp; Poverty. Statewide policy and advocacy on CalFresh/SNAP.</li>
        <li>Bay Area Legal Aid (BayLegal). Nine Bay Area counties.</li>
        <li>Public Counsel. Los Angeles.</li>
        <li>Legal Aid Foundation of Los Angeles (LAFLA). Los Angeles County.</li>
        <li>Inland Counties Legal Services (ICLS). Inland Empire.</li>
        <li>Your county welfare department&apos;s ombudsperson, if one exists.</li>
      </ul>

      <h2>New York</h2>
      <ul>
        <li>Legal Services NYC. <a href="https://www.legalservicesnyc.org/" target="_blank" rel="noopener noreferrer">legalservicesnyc.org</a>. Citywide.</li>
        <li>The Legal Aid Society. New York City. Benefits and public-assistance practice.</li>
        <li>LawHelpNY. <a href="https://www.lawhelpny.org/" target="_blank" rel="noopener noreferrer">lawhelpny.org</a>. Statewide lookup tool.</li>
        <li>Empire Justice Center. Statewide policy and advocacy.</li>
        <li>New York Legal Assistance Group (NYLAG). NYC.</li>
      </ul>

      <h2>National</h2>
      <ul>
        <li>Food Research &amp; Action Center (FRAC). <a href="https://frac.org/" target="_blank" rel="noopener noreferrer">frac.org</a>. National SNAP policy resource.</li>
        <li>National Center for Law and Economic Justice. National public-benefits law center.</li>
      </ul>

      <h2>What a SNAP legal-aid attorney can do</h2>
      <p>Review your Notice of Action and assess your case. Help you request a state fair hearing on time. Represent you at the hearing, usually free. Advise on whether aid paid pending applies and how to preserve it. Advise on judicial review if needed.</p>

      <h2>What Tended can do</h2>
      <p>Provide the verification records supporting any work-hours certification we signed. Your attorney can request them directly. Contact: <Placeholder>[contact email]</Placeholder>.</p>
      <hr />
      <p><em>Tended is not a law firm. This list is informational. It may not be complete or current. Please verify each organization&apos;s services and intake hours directly.</em></p>
    </ArticleShell>
  );
}
