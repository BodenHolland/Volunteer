import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Forgot your password or locked out | Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { t } = await getDict();
  const { prev, next } = neighbors(18, locale);
  const d = t.helpPasswordLockout;
  const title = locale === "es" ? d.titleEs : d.titleEn;

  return (
    <ArticleShell number={18} title={title} prev={prev} next={next}>
      {locale === "es" ? (
        <>
          <p>{d.introEs}</p>

          <h2>{d.resetHeadingEs}</h2>
          <p>
            Ve a <strong>/forgot-password</strong>, {d.resetPara1Es.replace("Ve a /forgot-password, ", "")}
          </p>
          <p>
            {d.resetPara2Es.replace(d.resetPara2BoldEs, "").split("")[0]}
            <strong>{d.resetPara2BoldEs}</strong>
            {", tendrás que iniciar sesión nuevamente en cada dispositivo donde estuvieras conectado."}
          </p>
          <p>{d.resetPara3Es}</p>
          <p>
            <strong>{d.resetPara4Es}</strong>{" "}{d.resetPara4TrailingEs}{" "}<strong>/forgot-password</strong>.
          </p>

          <h2>{d.lockoutHeadingEs}</h2>
          <p>{d.lockoutPara1Es}</p>
          <p>
            {d.lockoutPara2PreEs}{" "}<strong>/forgot-password</strong>{" "}{d.lockoutPara2PostEs}
          </p>
          <p>{d.lockoutPara3Es}</p>

          <h2>{d.requirementsHeadingEs}</h2>
          <p>
            {d.requirementsPara1PreEs}{" "}<strong>{d.requirementsPara1BoldEs}</strong>{d.requirementsPara1PostEs}
          </p>

          <h2>{d.noEmailHeadingEs}</h2>
          <ul>
            <li>{d.noEmailItem0Es}</li>
            <li>{d.noEmailItem1Es}</li>
            <li>{d.noEmailItem2Es}</li>
          </ul>

          <hr />
          <p>
            <em>
              {d.seeAlsoEs}{" "}
              <a href="/help/20-contact-bug">{d.seeAlsoLink1Es}</a>
              {" · "}
              <a href="/help/17-account-settings">{d.seeAlsoLink2Es}</a>.
            </em>
          </p>
        </>
      ) : (
        <>
          <p>{d.introEn}</p>

          <h2>{d.resetHeadingEn}</h2>
          <p>
            Go to <strong>/forgot-password</strong>, enter the email address you signed up with, and submit. A password reset link will be sent to that address.
          </p>
          <p>
            The link is single-use and expires after a short time. Click it, enter a new password (minimum 10 characters), and submit the form. After a successful reset,{" "}
            <strong>{d.resetPara2BoldEn}</strong>: you&apos;ll need to sign in again on every device where you were logged in.
          </p>
          <p>{d.resetPara3En}</p>
          <p>
            <strong>{d.resetPara4En}</strong>{" "}{d.resetPara4TrailingEn}{" "}<strong>/forgot-password</strong>.
          </p>

          <h2>{d.lockoutHeadingEn}</h2>
          <p>{d.lockoutPara1En}</p>
          <p>
            {d.lockoutPara2PreEn}{" "}<strong>/forgot-password</strong>{" "}{d.lockoutPara2PostEn}
          </p>
          <p>{d.lockoutPara3En}</p>

          <h2>{d.requirementsHeadingEn}</h2>
          <p>
            {d.requirementsPara1PreEn}{" "}<strong>{d.requirementsPara1BoldEn}</strong>{d.requirementsPara1PostEn}
          </p>

          <h2>{d.noEmailHeadingEn}</h2>
          <ul>
            <li>{d.noEmailItem0En}</li>
            <li>{d.noEmailItem1En}</li>
            <li>{d.noEmailItem2En}</li>
          </ul>

          <hr />
          <p>
            <em>
              {d.seeAlsoEn}{" "}
              <a href="/help/20-contact-bug">{d.seeAlsoLink1En}</a>
              {" · "}
              <a href="/help/17-account-settings">{d.seeAlsoLink2En}</a>.
            </em>
          </p>
        </>
      )}
    </ArticleShell>
  );
}
