import Link from "next/link";
import { ArticleShell } from "../_components/article-shell";
import { Placeholder } from "../_components/draft-banner";
import { neighbors } from "../_components/articles";
import { getDict, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "For caseworkers — a one-page methodology — Help Center" };

export default async function Page() {
  const locale = await getLocale();
  const { t } = await getDict();
  const { prev, next } = neighbors(12);

  if (locale === "es") {
    const prevEs = prev ? { ...prev, title: t.helpCaseworkers.prevTitleEs } : undefined;
    const nextEs = next ? { ...next, title: t.helpCaseworkers.nextTitleEs } : undefined;
    return (
      <ArticleShell number={12} starred title={t.helpCaseworkers.titleEs} prev={prevEs} next={nextEs}>
        <p><em>{t.helpCaseworkers.introEs}</em></p>
        <p><Link href="/for-caseworkers" className="text-forest underline underline-offset-2">{t.helpCaseworkers.resourceLinkEs}</Link> {t.helpCaseworkers.resourceLinkSuffixEs}</p>

        <h2>{t.helpCaseworkers.whoHeadingEs}</h2>
        <p>{t.helpCaseworkers.whoParaEs}</p>

        <h2>{t.helpCaseworkers.authorityHeadingEs}</h2>
        <ul>
          <li>{t.helpCaseworkers.authorityFederalEs}</li>
          <li>{t.helpCaseworkers.authorityCaliforniaEs}</li>
          <li>{t.helpCaseworkers.authorityNewYorkEs}</li>
          <li>{t.helpCaseworkers.authorityStatusEs}</li>
        </ul>

        <h2>{t.helpCaseworkers.verifyHeadingEs}</h2>
        <p>{t.helpCaseworkers.verifyParaEs}</p>

        <h2>{t.helpCaseworkers.remoteHeadingEs}</h2>
        <p>{t.helpCaseworkers.remotePara1Es}</p>
        <ul>
          <li>{t.helpCaseworkers.remoteBullet0Es}</li>
          <li>{t.helpCaseworkers.remoteBullet1Es}</li>
          <li>{t.helpCaseworkers.remoteBullet2Es}</li>
        </ul>

        <h2>{t.helpCaseworkers.formHeadingEs}</h2>
        <p>{t.helpCaseworkers.formParaEs}</p>
        <p>{t.helpCaseworkers.formContact} <Placeholder>{t.helpCaseworkers.formContactEmailEs}</Placeholder> / <Placeholder>{t.helpCaseworkers.formContactPhoneEs}</Placeholder>.</p>

        <h2>{t.helpCaseworkers.auditHeadingEs}</h2>
        <p>{t.helpCaseworkers.auditParaEs} <Placeholder>{t.helpCaseworkers.auditLinkEs}</Placeholder>.</p>

        <h2>{t.helpCaseworkers.dontHeadingEs}</h2>
        <p>{t.helpCaseworkers.dontParaEs}</p>
      </ArticleShell>
    );
  }

  return (
    <ArticleShell number={12} starred title={t.helpCaseworkers.title} prev={prev} next={next}>
      <p><em>{t.helpCaseworkers.intro}</em></p>
      <p><Link href="/for-caseworkers" className="text-forest underline underline-offset-2">{t.helpCaseworkers.resourceLink}</Link> {t.helpCaseworkers.resourceLinkSuffix}</p>

      <h2>{t.helpCaseworkers.whoHeading}</h2>
      <p>{t.helpCaseworkers.whoPara}</p>

      <h2>{t.helpCaseworkers.authorityHeading}</h2>
      <ul>
        <li>{t.helpCaseworkers.authorityFederal}</li>
        <li>{t.helpCaseworkers.authorityCalifornia}</li>
        <li>{t.helpCaseworkers.authorityNewYork}</li>
        <li>{t.helpCaseworkers.authorityStatus}</li>
      </ul>

      <h2>{t.helpCaseworkers.verifyHeading}</h2>
      <p>{t.helpCaseworkers.verifyPara}</p>

      <h2>{t.helpCaseworkers.remoteHeading}</h2>
      <p>{t.helpCaseworkers.remotePara1}</p>
      <p><strong>7 CFR §273.24(a)(2)(iii)</strong> {t.helpCaseworkers.remotePara2}</p>

      <h2>{t.helpCaseworkers.formHeading}</h2>
      <p>{t.helpCaseworkers.formPara}</p>
      <p>{t.helpCaseworkers.formContact} <Placeholder>{t.helpCaseworkers.formContactEmail}</Placeholder> / <Placeholder>{t.helpCaseworkers.formContactPhone}</Placeholder>.</p>

      <h2>{t.helpCaseworkers.auditHeading}</h2>
      <p>{t.helpCaseworkers.auditPara} <Placeholder>{t.helpCaseworkers.auditLink}</Placeholder>.</p>

      <h2>{t.helpCaseworkers.dontHeading}</h2>
      <p>{t.helpCaseworkers.dontPara}</p>
    </ArticleShell>
  );
}
