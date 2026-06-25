import { ArticleShell } from "../_components/article-shell";
import { neighbors } from "../_components/articles";
import { getDict, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Changing your account details | Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { t } = await getDict();
  const { prev, next } = neighbors(17, locale);
  const d = t.helpAccountSettings;
  const isEs = locale === "es";

  const title = isEs ? d.titleEs : d.title;

  return (
    <ArticleShell number={17} title={title} prev={prev} next={next}>
      {isEs ? (
        <>
          <p dangerouslySetInnerHTML={{ __html: d.introParaEs }} />

          <h2>{d.accountHeadingEs}</h2>
          <p dangerouslySetInnerHTML={{ __html: d.accountParaEs }} />

          <h2>{d.intentHeadingEs}</h2>
          <p>{d.intentParaEs}</p>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: d.intentOpt0Es }} />
            <li dangerouslySetInnerHTML={{ __html: d.intentOpt1Es }} />
            <li dangerouslySetInnerHTML={{ __html: d.intentOpt2Es }} />
          </ul>
          <p dangerouslySetInnerHTML={{ __html: d.intentSaveParaEs }} />

          <h2>{d.snapProfileHeadingEs}</h2>
          <p dangerouslySetInnerHTML={{ __html: d.snapProfileParaEs }} />
          <ul>
            <li>{d.snapField0Es}</li>
            <li>{d.snapField1Es}</li>
            <li>{d.snapField2Es}</li>
            <li>{d.snapField3Es}</li>
          </ul>
          <p>{d.snapProfileNoteEs}</p>

          <h2>{d.emailNotifHeadingEs}</h2>
          <p>{d.emailNotifParaEs}</p>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: d.notifOpt0Es }} />
            <li dangerouslySetInnerHTML={{ __html: d.notifOpt1Es }} />
          </ul>
          <p dangerouslySetInnerHTML={{ __html: d.notifSaveParaEs }} />

          <h2>{d.yourDataHeadingEs}</h2>
          <p dangerouslySetInnerHTML={{ __html: d.yourDataParaEs }} />

          <h2>{d.passwordHeadingEs}</h2>
          <p dangerouslySetInnerHTML={{ __html: d.passwordParaEs }} />

          <h2>{d.dangerZoneHeadingEs}</h2>
          <p>{d.dangerZoneParaEs}</p>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: d.signOutItemEs }} />
            <li dangerouslySetInnerHTML={{ __html: d.deleteAccountItemEs }} />
          </ul>

          <hr />
          <p><em dangerouslySetInnerHTML={{ __html: d.seeAlsoEs }} /></p>
        </>
      ) : (
        <>
          <p dangerouslySetInnerHTML={{ __html: d.introPara }} />

          <h2>{d.accountHeading}</h2>
          <p dangerouslySetInnerHTML={{ __html: d.accountPara }} />

          <h2>{d.intentHeading}</h2>
          <p>{d.intentPara}</p>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: d.intentOpt0 }} />
            <li dangerouslySetInnerHTML={{ __html: d.intentOpt1 }} />
            <li dangerouslySetInnerHTML={{ __html: d.intentOpt2 }} />
          </ul>
          <p dangerouslySetInnerHTML={{ __html: d.intentSavePara }} />

          <h2>{d.snapProfileHeading}</h2>
          <p dangerouslySetInnerHTML={{ __html: d.snapProfilePara }} />
          <ul>
            <li>{d.snapField0}</li>
            <li>{d.snapField1}</li>
            <li>{d.snapField2}</li>
            <li>{d.snapField3}</li>
          </ul>
          <p>{d.snapProfileNote}</p>

          <h2>{d.emailNotifHeading}</h2>
          <p>{d.emailNotifPara}</p>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: d.notifOpt0 }} />
            <li dangerouslySetInnerHTML={{ __html: d.notifOpt1 }} />
          </ul>
          <p dangerouslySetInnerHTML={{ __html: d.notifSavePara }} />

          <h2>{d.yourDataHeading}</h2>
          <p dangerouslySetInnerHTML={{ __html: d.yourDataPara }} />

          <h2>{d.passwordHeading}</h2>
          <p dangerouslySetInnerHTML={{ __html: d.passwordPara }} />

          <h2>{d.dangerZoneHeading}</h2>
          <p>{d.dangerZonePara}</p>
          <ul>
            <li dangerouslySetInnerHTML={{ __html: d.signOutItem }} />
            <li dangerouslySetInnerHTML={{ __html: d.deleteAccountItem }} />
          </ul>

          <hr />
          <p><em dangerouslySetInnerHTML={{ __html: d.seeAlso }} /></p>
        </>
      )}
    </ArticleShell>
  );
}
