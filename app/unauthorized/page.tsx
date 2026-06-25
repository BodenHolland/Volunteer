import { StatusPage } from "@/components/status-page";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = { title: "Not allowed | colift" };

export default async function UnauthorizedPage() {
  const { t } = await getDict();
  return (
    <StatusPage
      code="403"
      title={t.errorPages.unauthorizedTitle}
      body={t.errorPages.unauthorizedBody}
      primary={{ href: "/start", label: t.errorPages.switchIdentity }}
      secondary={{ href: "/", label: t.errorPages.backToHome }}
    />
  );
}
