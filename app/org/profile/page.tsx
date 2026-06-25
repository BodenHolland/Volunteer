import { Building2, CheckCircle2 } from "lucide-react";
import { requireOrgAdmin } from "@/lib/session";
import { getOrg } from "@/lib/queries";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { parseJson, type Address } from "@/lib/types";
import { updateOrg } from "./actions";
import { getDict } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Organization profile | colift" };

export default async function OrgProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { t } = await getDict();
  const user = await requireOrgAdmin();
  const sp = await searchParams;
  const org = user.org_id ? await getOrg(user.org_id) : null;
  if (!org) {
    return <EmptyState icon={<Building2 />} title={t.orgProfilePage.noOrgLinked} />;
  }
  const addr = parseJson<Address>(org.address_json, { line1: "", city: "", state: "", zip: "" });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">{t.orgProfilePage.title}</h1>
        <p className="mt-1 text-body">{t.orgProfilePage.subtitle}</p>
      </div>

      {sp.saved && (
        <div className="flex items-center gap-2 rounded-lg border border-forest/30 bg-forest-subtle p-3 text-sm font-medium text-forest">
          <CheckCircle2 className="size-4" /> {t.orgProfilePage.saved}
        </div>
      )}

      <form action={updateOrg} className="space-y-8">
        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">{t.orgProfilePage.basicsSection}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">{t.orgProfilePage.orgName}</Label>
            <Input id="name" name="name" required defaultValue={org.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about_md">{t.orgProfilePage.about}</Label>
            <Textarea id="about_md" name="about_md" defaultValue={org.about_md ?? ""} className="min-h-[120px]" placeholder={t.orgProfilePage.aboutPlaceholder} />
            <p className="text-xs text-meta">{t.orgProfilePage.aboutHelp}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">{t.orgProfilePage.contactEmail}</Label>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={org.contact_email ?? ""} placeholder={t.orgProfilePage.contactEmailPlaceholder} />
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">{t.orgProfilePage.signingAuthority}</h2>
            <p className="text-sm text-body">{t.orgProfilePage.signingAuthorityDesc}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="signing_authority_name">{t.orgProfilePage.signingAuthorityName}</Label>
              <Input id="signing_authority_name" name="signing_authority_name" defaultValue={org.signing_authority_name ?? ""} placeholder={t.orgProfilePage.signingAuthorityNamePlaceholder} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signing_authority_title">{t.orgProfilePage.signingAuthorityTitle}</Label>
              <Input id="signing_authority_title" name="signing_authority_title" defaultValue={org.signing_authority_title ?? ""} placeholder={t.orgProfilePage.signingAuthorityTitlePlaceholder} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">{t.orgProfilePage.address}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="line1">{t.orgProfilePage.streetAddress}</Label>
            <Input id="line1" name="line1" defaultValue={addr.line1 ?? ""} placeholder={t.orgProfilePage.streetAddressPlaceholder} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line2">{t.orgProfilePage.suite}</Label>
            <Input id="line2" name="line2" defaultValue={addr.line2 ?? ""} placeholder={t.orgProfilePage.suitePlaceholder} />
          </div>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="city">{t.orgProfilePage.city}</Label>
              <Input id="city" name="city" defaultValue={addr.city ?? ""} placeholder={t.orgProfilePage.cityPlaceholder} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">{t.orgProfilePage.state}</Label>
              <Input id="state" name="state" defaultValue={addr.state ?? ""} placeholder={t.orgProfilePage.statePlaceholder} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">{t.orgProfilePage.zip}</Label>
              <Input id="zip" name="zip" defaultValue={addr.zip ?? ""} placeholder={t.orgProfilePage.zipPlaceholder} />
            </div>
          </div>
        </section>

        <Button type="submit">{t.orgProfilePage.submit}</Button>
      </form>
    </div>
  );
}
