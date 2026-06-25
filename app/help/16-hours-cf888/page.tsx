import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your hours and how to download your CF 888 | Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { t } = await getDict();
  const { prev, next } = neighbors(16, locale);
  const title =
    locale === "es"
      ? t.helpHoursCf888.titleEs
      : t.helpHoursCf888.title;

  return (
    <ArticleShell number={16} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <h2>{t.helpHoursCf888.howCreditedHeadingEs}</h2>
          <p>{t.helpHoursCf888.howCreditedPara1Es}</p>
          <p>{t.helpHoursCf888.howCreditedPara2Es}</p>

          <h2>{t.helpHoursCf888.whereToSeeHeadingEs}</h2>
          <p>
            {t.helpHoursCf888.whereToSeePara1Es.replace("{app}", "")}<strong>/app</strong>{t.helpHoursCf888.whereToSeePara1Es.split("{app}")[1] ?? ""}
          </p>
          <p>{t.helpHoursCf888.whereToSeePara2Es}</p>
          <ul>
            <li>
              <strong>{t.helpHoursCf888.statePendingEs}</strong>: {t.helpHoursCf888.statePendingDescEs}
            </li>
            <li>
              <strong>{t.helpHoursCf888.stateCertifiedEs}</strong>: {t.helpHoursCf888.stateCertifiedDescEs}
            </li>
          </ul>

          <h2>{t.helpHoursCf888.whatIsCf888HeadingEs}</h2>
          <p>{t.helpHoursCf888.whatIsCf888Para1Es}</p>
          <p>{t.helpHoursCf888.whatIsCf888Para2Es}</p>

          <h2>{t.helpHoursCf888.howToDownloadHeadingEs}</h2>
          <p>{t.helpHoursCf888.howToDownloadIntroEs}</p>
          <ol>
            <li>Ve a <strong>{t.helpHoursCf888.howToDownloadStep1ConfiguracionEs}</strong> (menú superior derecho).</li>
            <li>
              Desplázate hasta la sección <strong>{t.helpHoursCf888.howToDownloadStep2InformesEs}</strong>. Esta sección solo
              aparece si tu intención es certificación SNAP.
            </li>
            <li>Haz clic en <strong>{t.helpHoursCf888.howToDownloadStep3DescargarEs}</strong> junto al mes correspondiente.</li>
          </ol>
          <p>
            {t.helpHoursCf888.howToDownloadPara1PreEs} <strong>{t.helpHoursCf888.howToDownloadPara1StrongEs}</strong>{" "}
            {t.helpHoursCf888.howToDownloadPara1PostEs}
          </p>
          <p>{t.helpHoursCf888.howToDownloadPara2Es}</p>

          <h2>{t.helpHoursCf888.commonQuestionsHeadingEs}</h2>
          <p>
            <strong>{t.helpHoursCf888.faq1QEs}</strong> {t.helpHoursCf888.faq1AEs}
          </p>
          <p>
            <strong>{t.helpHoursCf888.faq2QEs}</strong> {t.helpHoursCf888.faq2AEs}
          </p>
          <p>
            <strong>{t.helpHoursCf888.faq3QEs}</strong> {t.helpHoursCf888.faq3AEs}
          </p>

          <hr />
          <p>
            <em>
              {t.helpHoursCf888.seeAlsoPreEs}{" "}
              <a href="/help/8-verify">{t.helpHoursCf888.seeAlsoVerifyEs}</a>,{" "}
              <a href="/help/10-certifier">{t.helpHoursCf888.seeAlsoCertifierEs}</a>,{" "}
              <a href="/help/15-complete-work">{t.helpHoursCf888.seeAlsoCompleteEs}</a>.
            </em>
          </p>
        </>
      ) : (
        <>
          <h2>{t.helpHoursCf888.howCreditedHeading}</h2>
          <p>{t.helpHoursCf888.howCreditedPara1}</p>
          <p>{t.helpHoursCf888.howCreditedPara2}</p>

          <h2>{t.helpHoursCf888.whereToSeeHeading}</h2>
          <p>
            The main dashboard (<strong>/app</strong>) shows a progress ring with &ldquo;X of 80
            hours&rdquo; for the current month. The 80-hour figure is the California ABAWD monthly
            target.
          </p>
          <p>{t.helpHoursCf888.whereToSeePara2}</p>
          <ul>
            <li>
              <strong>{t.helpHoursCf888.statePending}</strong>: {t.helpHoursCf888.statePendingDesc}
            </li>
            <li>
              <strong>{t.helpHoursCf888.stateCertified}</strong>: {t.helpHoursCf888.stateCertifiedDesc}
            </li>
          </ul>

          <h2>{t.helpHoursCf888.whatIsCf888Heading}</h2>
          <p>{t.helpHoursCf888.whatIsCf888Para1}</p>
          <p>{t.helpHoursCf888.whatIsCf888Para2}</p>

          <h2>{t.helpHoursCf888.howToDownloadHeading}</h2>
          <p>{t.helpHoursCf888.howToDownloadIntro}</p>
          <ol>
            <li>Go to <strong>{t.helpHoursCf888.howToDownloadStep1Settings}</strong> (top-right menu).</li>
            <li>
              Scroll to the <strong>{t.helpHoursCf888.howToDownloadStep2PreviousReports}</strong> section. This section only appears if
              your account intent is SNAP certification.
            </li>
            <li>Click <strong>{t.helpHoursCf888.howToDownloadStep3Download}</strong> next to the month you need.</li>
          </ol>
          <p>
            {t.helpHoursCf888.howToDownloadPara1Pre}{" "}
            <strong>{t.helpHoursCf888.howToDownloadPara1Strong}</strong> {t.helpHoursCf888.howToDownloadPara1Post}
          </p>
          <p>{t.helpHoursCf888.howToDownloadPara2}</p>

          <h2>{t.helpHoursCf888.commonQuestionsHeading}</h2>
          <p>
            <strong>{t.helpHoursCf888.faq1Q}</strong> {t.helpHoursCf888.faq1A}
          </p>
          <p>
            <strong>{t.helpHoursCf888.faq2Q}</strong> {t.helpHoursCf888.faq2A}
          </p>
          <p>
            <strong>{t.helpHoursCf888.faq3Q}</strong> {t.helpHoursCf888.faq3A}
          </p>

          <hr />
          <p>
            <em>
              {t.helpHoursCf888.seeAlsoPre}{" "}
              <a href="/help/8-verify">{t.helpHoursCf888.seeAlsoVerify}</a>,{" "}
              <a href="/help/10-certifier">{t.helpHoursCf888.seeAlsoCertifier}</a>,{" "}
              <a href="/help/15-complete-work">{t.helpHoursCf888.seeAlsoComplete}</a>.
            </em>
          </p>
        </>
      )}
    </ArticleShell>
  );
}
