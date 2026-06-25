import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getLocale } from "@/lib/i18n";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Report a bug or contact us — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { t } = await getDict();
  const { prev, next } = neighbors(20, locale);
  const isEs = locale === "es";

  const title = isEs
    ? t.helpContactBug.titleEs
    : t.helpContactBug.titleEn;

  return (
    <ArticleShell number={20} title={title} prev={prev} next={next}>
      {isEs ? (
        <>
          <p>{t.helpContactBug.introEs}</p>

          <h2>{t.helpContactBug.beforeReachOutHeadingEs}</h2>
          <p>{t.helpContactBug.quickFixesLeadEs}</p>
          <ul>
            <li>
              <strong>{t.helpContactBug.fix0StrongEs}</strong> Consulta{" "}
              <a href="/help/18-password-lockout">{t.helpContactBug.fix0LinkTextEs}</a>
              {t.helpContactBug.fix0TrailEs}
            </li>
            <li>
              <strong>{t.helpContactBug.fix1StrongEs}</strong>
              {t.helpContactBug.fix1TrailEs}
            </li>
            <li>
              <strong>{t.helpContactBug.fix2StrongEs}</strong>
              {t.helpContactBug.fix2TrailEs}
              <em>{t.helpContactBug.fix2EmEs}</em>
              {t.helpContactBug.fix2Trail2Es}
            </li>
            <li>
              <strong>{t.helpContactBug.fix3StrongEs}</strong>
              {t.helpContactBug.fix3TrailEs}
              <strong>{t.helpContactBug.fix3StartStrongEs}</strong>
              {t.helpContactBug.fix3Trail2Es}
            </li>
          </ul>
          <p>{t.helpContactBug.noneApplyEs}</p>

          <h2>{t.helpContactBug.howToReachHeadingEs}</h2>
          <p>
            {t.helpContactBug.reach1Es}
            <strong>/contact</strong>
            {t.helpContactBug.reach1TrailEs}
          </p>
          <p>{t.helpContactBug.reach2Es}</p>
          <p>{t.helpContactBug.reach3Es}</p>

          <h2>{t.helpContactBug.bugReportHeadingEs}</h2>
          <p>{t.helpContactBug.bugReportLeadEs}</p>
          <ul>
            <li>
              <strong>{t.helpContactBug.bug0StrongEs}</strong>
              {t.helpContactBug.bug0TrailEs}
            </li>
            <li>
              <strong>{t.helpContactBug.bug1StrongEs}</strong>
              {t.helpContactBug.bug1TrailEs}
            </li>
            <li>
              <strong>{t.helpContactBug.bug2StrongEs}</strong>
              {t.helpContactBug.bug2TrailEs}
            </li>
            <li>
              <strong>{t.helpContactBug.bug3StrongEs}</strong>
              {t.helpContactBug.bug3TrailEs}
            </li>
            <li>
              <strong>{t.helpContactBug.bug4StrongEs}</strong>
              {t.helpContactBug.bug4TrailEs}
            </li>
            <li>
              <strong>{t.helpContactBug.bug5StrongEs}</strong>
              {t.helpContactBug.bug5TrailEs}
            </li>
          </ul>

          <p>{t.helpContactBug.snapNoteEs}</p>

          <hr />
          <p>
            <em>
              {t.helpContactBug.seeAlsoEs}{" "}
              <a href="/help/18-password-lockout">
                {t.helpContactBug.seeAlsoLink1Es}
              </a>{" "}
              &middot;{" "}
              <a href="/help">{t.helpContactBug.helpCenterEs}</a>.
            </em>
          </p>
        </>
      ) : (
        <>
          <p>{t.helpContactBug.introEn}</p>

          <h2>{t.helpContactBug.beforeReachOutHeadingEn}</h2>
          <p>{t.helpContactBug.quickFixesLeadEn}</p>
          <ul>
            <li>
              <strong>{t.helpContactBug.fix0StrongEn}</strong> See{" "}
              <a href="/help/18-password-lockout">{t.helpContactBug.fix0LinkTextEn}</a>
              {t.helpContactBug.fix0TrailEn}
            </li>
            <li>
              <strong>{t.helpContactBug.fix1StrongEn}</strong>
              {t.helpContactBug.fix1TrailEn}
            </li>
            <li>
              <strong>{t.helpContactBug.fix2StrongEn}</strong>
              {t.helpContactBug.fix2TrailEn}
              <em>{t.helpContactBug.fix2EmEn}</em>
              {t.helpContactBug.fix2Trail2En}
            </li>
            <li>
              <strong>{t.helpContactBug.fix3StrongEn}</strong>
              {t.helpContactBug.fix3TrailEn}
              <strong>{t.helpContactBug.fix3StartStrongEn}</strong>
              {t.helpContactBug.fix3Trail2En}
            </li>
          </ul>
          <p>{t.helpContactBug.noneApplyEn}</p>

          <h2>{t.helpContactBug.howToReachHeadingEn}</h2>
          <p>
            {t.helpContactBug.reach1En}
            <strong>/contact</strong>
            {t.helpContactBug.reach1TrailEn}
          </p>
          <p>{t.helpContactBug.reach2En}</p>
          <p>{t.helpContactBug.reach3En}</p>

          <h2>{t.helpContactBug.bugReportHeadingEn}</h2>
          <p>{t.helpContactBug.bugReportLeadEn}</p>
          <ul>
            <li>
              <strong>{t.helpContactBug.bug0StrongEn}</strong>
              {t.helpContactBug.bug0TrailEn}
            </li>
            <li>
              <strong>{t.helpContactBug.bug1StrongEn}</strong>
              {t.helpContactBug.bug1TrailEn}
            </li>
            <li>
              <strong>{t.helpContactBug.bug2StrongEn}</strong>
              {t.helpContactBug.bug2TrailEn}
            </li>
            <li>
              <strong>{t.helpContactBug.bug3StrongEn}</strong>
              {t.helpContactBug.bug3TrailEn}
            </li>
            <li>
              <strong>{t.helpContactBug.bug4StrongEn}</strong>
              {t.helpContactBug.bug4TrailEn}
            </li>
            <li>
              <strong>{t.helpContactBug.bug5StrongEn}</strong>
              {t.helpContactBug.bug5TrailEn}
            </li>
          </ul>

          <p>{t.helpContactBug.snapNoteEn}</p>

          <hr />
          <p>
            <em>
              {t.helpContactBug.seeAlsoEn}{" "}
              <a href="/help/18-password-lockout">
                {t.helpContactBug.seeAlsoLink1En}
              </a>{" "}
              &middot;{" "}
              <a href="/help">{t.helpContactBug.helpCenterEn}</a>.
            </em>
          </p>
        </>
      )}
    </ArticleShell>
  );
}
