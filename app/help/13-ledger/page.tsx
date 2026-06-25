import { ArticleShell } from "../_components/article-shell";
import { Placeholder } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";
import { getDict, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Audit & methodology ledger | Help Center" };

export default async function Page() {
  const { t } = await getDict();
  const locale = await getLocale();
  const { prev, next } = neighbors(13);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: "Para trabajadores sociales: una metodología en una página" } : undefined;
    const nextEs = next ? { ...next, title: "Qué pasa si un condado cuestiona tus horas" } : undefined;
    return (
      <ArticleShell number={13} title={t.helpLedger.titleEs} prev={prevEs} next={nextEs}>
        <p>{t.helpLedger.introEs}</p>

        <h2>{t.helpLedger.whatsInHeadingEs}</h2>
        <p>{t.helpLedger.whatsIn0Es}</p>
        <p>{t.helpLedger.whatsIn1Es}</p>
        <p>{t.helpLedger.whatsIn2Es}</p>
        <p>{t.helpLedger.whatsIn3Es}</p>
        <p>{t.helpLedger.whatsIn4Es}</p>
        <p>{t.helpLedger.whatsIn5Es}</p>

        <h2>{t.helpLedger.whatsNotInHeadingEs}</h2>
        <p>{t.helpLedger.whatsNotIn0Es}</p>
        <p>{t.helpLedger.whatsNotIn1Es}</p>

        <h2>{t.helpLedger.whyHeadingEs}</h2>
        <p>{t.helpLedger.whyBodyEs}</p>

        <h2>{t.helpLedger.accessHeadingEs}</h2>
        <p>{t.helpLedger.accessBodyEs.replace('{ledgerUrl}', '')}<Placeholder>[URL del registro]</Placeholder>{t.helpLedger.accessBodyEs.split('{ledgerUrl}')[1]}</p>

        <h2>{t.helpLedger.formalReviewsHeadingEs}</h2>
        <p>{t.helpLedger.formalReviewsBodyEs.split('{contactEmail}')[0]}<Placeholder>[correo de contacto]</Placeholder>{t.helpLedger.formalReviewsBodyEs.split('{contactEmail}')[1]}</p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={13} title={t.helpLedger.title} prev={prev} next={next}>
      <p>{t.helpLedger.intro}</p>

      <h2>{t.helpLedger.whatsInHeading}</h2>
      <p>{t.helpLedger.whatsIn0}</p>
      <p>{t.helpLedger.whatsIn1}</p>
      <p>{t.helpLedger.whatsIn2}</p>
      <p>{t.helpLedger.whatsIn3}</p>
      <p>{t.helpLedger.whatsIn4}</p>
      <p>{t.helpLedger.whatsIn5}</p>

      <h2>{t.helpLedger.whatsNotInHeading}</h2>
      <p>{t.helpLedger.whatsNotIn0}</p>
      <p>{t.helpLedger.whatsNotIn1}</p>

      <h2>{t.helpLedger.whyHeading}</h2>
      <p>{t.helpLedger.whyBody}</p>

      <h2>{t.helpLedger.accessHeading}</h2>
      <p>{t.helpLedger.accessBody.split('{ledgerUrl}')[0]}<Placeholder>[ledger URL]</Placeholder>{t.helpLedger.accessBody.split('{ledgerUrl}')[1]}</p>

      <h2>{t.helpLedger.formalReviewsHeading}</h2>
      <p>{t.helpLedger.formalReviewsBody.split('{contactEmail}')[0]}<Placeholder>[contact email]</Placeholder>{t.helpLedger.formalReviewsBody.split('{contactEmail}')[1]}</p>
    </ArticleShell>
  );
}
