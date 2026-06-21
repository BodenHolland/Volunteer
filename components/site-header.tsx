import { getCurrentUser, homeForUser } from "@/lib/session";
import { SiteHeaderClient, type PublicNavStrings } from "@/components/site-header-client";

/**
 * The public-facing header is deliberately session-aware. Public pages such as
 * /how-it-works remain useful to visitors, but they must not pretend a signed
 * in person is anonymous or send them back through /login just to return home.
 */
export async function SiteHeader({
  locale = "en",
  t,
}: {
  locale?: "en" | "es";
  t?: PublicNavStrings;
}) {
  const user = await getCurrentUser();

  return (
    <SiteHeaderClient
      locale={locale}
      t={t}
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
