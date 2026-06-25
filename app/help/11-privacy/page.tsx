import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Privacy, PII, and what we publish — Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(11);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: t.helpPrivacy.prevTitleEs } : undefined;
    const nextEs = next ? { ...next, title: t.helpPrivacy.nextTitleEs } : undefined;
    return (
      <ArticleShell number={11} title={t.helpPrivacy.titleEs} prev={prevEs} next={nextEs}>
        <p>{t.helpPrivacy.introEs}</p>

        <h2>{t.helpPrivacy.principlesHeadingEs}</h2>
        <p>{t.helpPrivacy.principlesPara1Es}</p>
        <p>{t.helpPrivacy.principlesPara2Es}</p>
        <p>{t.helpPrivacy.principlesPara3Es}</p>
        <p>{t.helpPrivacy.principlesPara4Es}</p>
        <p>{t.helpPrivacy.principlesPara5Es}</p>

        <h2>{t.helpPrivacy.volunteersHeadingEs}</h2>
        <p>{t.helpPrivacy.volunteersParaEs}</p>
        <ul>
          <li>{t.helpPrivacy.volunteersItem0Es}</li>
          <li>{t.helpPrivacy.volunteersItem1Es}</li>
          <li>{t.helpPrivacy.volunteersItem2Es}</li>
        </ul>

        <h2>{t.helpPrivacy.dontDoHeadingEs}</h2>
        <p>{t.helpPrivacy.dontDoPara1Es}</p>
        <p>{t.helpPrivacy.dontDoPara2Es}</p>
        <p>{t.helpPrivacy.dontDoPara3Es}</p>

        <h2>{t.helpPrivacy.monitoringHeadingEs}</h2>
        <p>{t.helpPrivacy.monitoringParaEs}</p>

        <h2>{t.helpPrivacy.legalHeadingEs}</h2>
        <p>{t.helpPrivacy.legalParaEs}</p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={11} title={t.helpPrivacy.title} prev={prev} next={next}>
      <p>{t.helpPrivacy.intro}</p>

      <h2>{t.helpPrivacy.principlesHeading}</h2>
      <p>{t.helpPrivacy.principlesPara1}</p>
      <p>{t.helpPrivacy.principlesPara2}</p>
      <p>{t.helpPrivacy.principlesPara3}</p>
      <p>{t.helpPrivacy.principlesPara4}</p>
      <p>{t.helpPrivacy.principlesPara5}</p>

      <h2>{t.helpPrivacy.volunteersHeading}</h2>
      <p>{t.helpPrivacy.volunteersPara}</p>
      <ul>
        <li>{t.helpPrivacy.volunteersItem0}</li>
        <li>{t.helpPrivacy.volunteersItem1}</li>
        <li>{t.helpPrivacy.volunteersItem2}</li>
      </ul>

      <h2>{t.helpPrivacy.dontDoHeading}</h2>
      <p>{t.helpPrivacy.dontDoPara1}</p>
      <p>{t.helpPrivacy.dontDoPara2}</p>
      <p>{t.helpPrivacy.dontDoPara3}</p>

      <h2>{t.helpPrivacy.monitoringHeading}</h2>
      <p>{t.helpPrivacy.monitoringPara}</p>

      <h2>{t.helpPrivacy.legalHeading}</h2>
      <p>{t.helpPrivacy.legalPara}</p>
    </ArticleShell>
  );
}
