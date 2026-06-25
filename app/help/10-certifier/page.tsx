import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Who certifies your hours — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { t } = await getDict();
  const { prev, next } = neighbors(10);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: t.helpCertifier.esPrevTitle } : undefined;
    const nextEs = next ? { ...next, title: t.helpCertifier.esNextTitle } : undefined;
    return (
      <ArticleShell number={10} title={t.helpCertifier.esTitle} prev={prevEs} next={nextEs}>
        <p>{t.helpCertifier.esIntro}</p>

        <h2>{t.helpCertifier.esWhoSignsHeading}</h2>
        <p>{t.helpCertifier.esWhoSignsBody}</p>

        <h2>{t.helpCertifier.esFormRequiresHeading}</h2>
        <p>{t.helpCertifier.esFormRequiresIntro}</p>
        <blockquote>
          <p>{t.helpCertifier.esFormQuote}</p>
        </blockquote>
        <p>{t.helpCertifier.esFormNotRequiredIntro}</p>
        <ul>
          <li>{t.helpCertifier.esFormNotRequired0}</li>
          <li>{t.helpCertifier.esFormNotRequired1}</li>
          <li>{t.helpCertifier.esFormNotRequired2}</li>
        </ul>

        <h2>{t.helpCertifier.esWhatCertifyingHeading}</h2>
        <p>{t.helpCertifier.esWhatCertifyingBody}</p>

        <h2>{t.helpCertifier.esHowSignedHeading}</h2>
        <p>{t.helpCertifier.esHowSignedBody1}</p>
        <p>{t.helpCertifier.esHowSignedBody2}</p>

        <h2>{t.helpCertifier.esIndependenceHeading}</h2>
        <p>{t.helpCertifier.esIndependenceBody}</p>

        <h2>{t.helpCertifier.esWhatNotHeading}</h2>
        <p>{t.helpCertifier.esWhatNotBody1}</p>
        <p>{t.helpCertifier.esWhatNotBody2}</p>
        <hr />
        <p><em>{t.helpCertifier.esLegalNote} <a href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf" target="_blank" rel="noopener noreferrer">{t.helpCertifier.esLegalLink}</a>.</em></p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={10} title={t.helpCertifier.enTitle} prev={prev} next={next}>
      <p>{t.helpCertifier.enIntro}</p>

      <h2>{t.helpCertifier.enWhoSignsHeading}</h2>
      <p>{t.helpCertifier.enWhoSignsBody}</p>

      <h2>{t.helpCertifier.enFormRequiresHeading}</h2>
      <p>{t.helpCertifier.enFormRequiresIntro}</p>
      <blockquote>
        <p>{t.helpCertifier.enFormQuote}</p>
      </blockquote>
      <p>{t.helpCertifier.enFormNotRequiredIntro}</p>
      <ul>
        <li>{t.helpCertifier.enFormNotRequired0}</li>
        <li>{t.helpCertifier.enFormNotRequired1}</li>
        <li>{t.helpCertifier.enFormNotRequired2}</li>
      </ul>

      <h2>{t.helpCertifier.enWhatCertifyingHeading}</h2>
      <p>{t.helpCertifier.enWhatCertifyingBody}</p>

      <h2>{t.helpCertifier.enHowSignedHeading}</h2>
      <p>{t.helpCertifier.enHowSignedBody1}</p>
      <p>{t.helpCertifier.enHowSignedBody2}</p>

      <h2>{t.helpCertifier.enIndependenceHeading}</h2>
      <p>{t.helpCertifier.enIndependenceBody}</p>

      <h2>{t.helpCertifier.enWhatNotHeading}</h2>
      <p>{t.helpCertifier.enWhatNotBody1}</p>
      <p>{t.helpCertifier.enWhatNotBody2}</p>
      <hr />
      <p><em>{t.helpCertifier.enLegalNote} <a href="https://cdss.ca.gov/Portals/9/Additional-Resources/Forms-and-Brochures/2020/A-D/CF888.pdf" target="_blank" rel="noopener noreferrer">{t.helpCertifier.enLegalLink}</a>.</em></p>
    </ArticleShell>
  );
}
