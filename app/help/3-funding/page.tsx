import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Who funds colift — Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(3, locale);
  const title = locale === "es" ? "Quién financia colift" : "Who funds colift";

  return (
    <ArticleShell number={3} title={title} prev={prev} next={next}>
      <p>{t.helpFunding.intro}</p>

      <h2>{t.helpFunding.whyHeading}</h2>
      <p>{t.helpFunding.whyBody}</p>

      <h2>{t.helpFunding.acceptHeading}</h2>
      <p>{t.helpFunding.acceptBody}</p>

      <h2>{t.helpFunding.declineHeading}</h2>
      <p>{t.helpFunding.declineBody}</p>

      <h2>{t.helpFunding.governanceHeading}</h2>
      <p>{t.helpFunding.governanceBody}</p>

      <h2>{t.helpFunding.lobbyingHeading}</h2>
      <p>{t.helpFunding.lobbyingBody}</p>
      <hr />
      <p><em>{t.helpFunding.seeAlso}</em></p>
    </ArticleShell>
  );
}
