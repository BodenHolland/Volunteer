import { getCurrentUser, homeForUser } from "@/lib/session";
import { getDict } from "@/lib/i18n";
import { SiteHeaderClient } from "@/components/site-header-client";

/**
 * The public-facing header is deliberately session-aware. Public pages such as
 * /how-it-works remain useful to visitors, but they must not pretend a signed
 * in person is anonymous or send them back through /login just to return home.
 *
 * It fetches the locale + dictionary itself so the nav translates on every page
 * that renders it, with no per-page wiring.
 */
export async function SiteHeader() {
  const [user, { locale, t }] = await Promise.all([getCurrentUser(), getDict()]);

  return (
    <SiteHeaderClient
      locale={locale}
      t={{
        howItWorks: t.nav.howItWorks,
        about: t.nav.about,
        forOrgs: t.nav.forOrgs,
        signIn: t.nav.signIn,
        seeTasks: t.nav.seeTasks,
        help: t.footer.help,
      }}
      viewer={
        user
          ? {
              name: user.full_name ?? user.email.split("@")[0] ?? "You",
              email: user.email,
              role: user.role,
              isSnap: user.intent === "snap_cert",
              home: homeForUser(user),
              isOrgAdmin: user.org_role === "org_admin",
            }
          : null
      }
    />
  );
}
