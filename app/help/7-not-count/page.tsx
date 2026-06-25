import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "What does NOT count | Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(7, locale);

  return (
    <ArticleShell number={7} title={t.helpNotCount.title} prev={prev} next={next}>
      <p>{t.helpNotCount.intro}</p>

      <h2>{t.helpNotCount.selfHelpHeading}</h2>
      <p>{t.helpNotCount.selfHelpBody}</p>

      <h2>{t.helpNotCount.paidSurveysHeading}</h2>
      <p>{t.helpNotCount.paidSurveysBody}</p>

      <h2>{t.helpNotCount.socialMediaHeading}</h2>
      <p>{t.helpNotCount.socialMediaBody}</p>

      <h2>{t.helpNotCount.educationHeading}</h2>
      <p>{t.helpNotCount.educationBody}</p>

      <h2>{t.helpNotCount.lobbyingHeading}</h2>
      <p>{t.helpNotCount.lobbyingBody}</p>

      <h2>{t.helpNotCount.passiveTimeHeading}</h2>
      <p>{t.helpNotCount.passiveTimeBody}</p>

      <h2>{t.helpNotCount.paddedContentHeading}</h2>
      <p>{t.helpNotCount.paddedContentBody}</p>

      <h2>{t.helpNotCount.selfDisclosureHeading}</h2>
      <p>{t.helpNotCount.selfDisclosureBody}</p>

      <h2>{t.helpNotCount.unverifiableHeading}</h2>
      <p>{t.helpNotCount.unverifiableBody}</p>

      <h2>{t.helpNotCount.commercialHeading}</h2>
      <p>{t.helpNotCount.commercialBody}</p>
      <hr />
      <p><em>{t.helpNotCount.footerNote}</em></p>
    </ArticleShell>
  );
}
