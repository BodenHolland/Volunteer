import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "How we verify volunteer hours | Help Center" };

export default async function Page() {
  const { locale, t } = await getDict();
  const { prev, next } = neighbors(8);
  const h = t.helpVerify;

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: h.esPrevTitle } : undefined;
    const nextEs = next ? { ...next, title: h.esNextTitle } : undefined;
    return (
      <ArticleShell number={8} starred title={h.esTitleEs} prev={prevEs} next={nextEs}>
        <p>{h.introEs}</p>

        <h2>{h.ruleHeadingEs}</h2>
        <pre><code>{h.ruleCodeEs}</code></pre>
        <p>{h.ruleParaEs}</p>

        <h2>{h.engagementHeadingEs}</h2>
        <p>{h.engagementPara1Es}</p>
        <p>{h.engagementPara2Es}</p>
        <p>{h.engagementPara3Es}</p>

        <h2>{h.attestationHeadingEs}</h2>
        <p>{h.attestationParaEs}</p>

        <h2>{h.capHeadingEs}</h2>
        <p>{h.capPara1Es}</p>
        <p>{h.capPara2Es}</p>

        <h2>{h.validationHeadingEs}</h2>
        <p>{h.validationPara1Es}</p>
        <ul>
          <li>{h.validationItem0Es}</li>
          <li>{h.validationItem1Es}</li>
          <li>{h.validationItem2Es}</li>
          <li>{h.validationItem3Es}</li>
          <li>{h.validationItem4Es}</li>
        </ul>
        <p>{h.validationPara2Es}</p>

        <h2>{h.dontHeadingEs}</h2>
        <p>{h.dontPara0Es}</p>
        <p>{h.dontPara1Es}</p>
        <p>{h.dontPara2Es}</p>
        <p>{h.dontPara3Es}</p>

        <h2>{h.certifierHeadingEs}</h2>
        <p>{h.certifierParaEs}</p>

        <h2>{h.openMethodHeadingEs}</h2>
        <p>{h.openMethodParaEs}</p>
        <hr />
        <p><em>{h.legalNoteEs}</em></p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={8} starred title={h.title} prev={prev} next={next}>
      <p>{h.intro}</p>

      <h2>{h.ruleHeading}</h2>
      <pre><code>{h.ruleCode}</code></pre>
      <p>{h.rulePara}</p>

      <h2>{h.engagementHeading}</h2>
      <p>{h.engagementPara1}</p>
      <p>{h.engagementPara2}</p>
      <p>{h.engagementPara3}</p>

      <h2>{h.attestationHeading}</h2>
      <p>{h.attestationPara}</p>

      <h2>{h.capHeading}</h2>
      <p>{h.capPara1}</p>
      <p>{h.capPara2}</p>

      <h2>{h.validationHeading}</h2>
      <p>{h.validationPara1}</p>
      <ul>
        <li>{h.validationItem0}</li>
        <li>{h.validationItem1}</li>
        <li>{h.validationItem2}</li>
        <li>{h.validationItem3}</li>
        <li>{h.validationItem4}</li>
      </ul>
      <p>{h.validationPara2}</p>

      <h2>{h.dontHeading}</h2>
      <p>{h.dontPara0}</p>
      <p>{h.dontPara1}</p>
      <p>{h.dontPara2}</p>
      <p>{h.dontPara3}</p>

      <h2>{h.certifierHeading}</h2>
      <p>{h.certifierPara}</p>

      <h2>{h.openMethodHeading}</h2>
      <p>{h.openMethodPara}</p>
      <hr />
      <p><em>{h.legalNote}</em></p>
    </ArticleShell>
  );
}
