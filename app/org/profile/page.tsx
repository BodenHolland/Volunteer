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

export const dynamic = "force-dynamic";
export const metadata = { title: "Organization profile — Tended" };

export default async function OrgProfilePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireOrgAdmin();
  const sp = await searchParams;
  const org = user.org_id ? await getOrg(user.org_id) : null;
  if (!org) {
    return <EmptyState icon={<Building2 />} title="No organization linked to this account." />;
  }
  const addr = parseJson<Address>(org.address_json, { line1: "", city: "", state: "", zip: "" });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">Organization profile</h1>
        <p className="mt-1 text-body">This information appears on your public page and the organization section of each work-hours certification.</p>
      </div>

      {sp.saved && (
        <div className="flex items-center gap-2 rounded-lg border border-forest/30 bg-forest-subtle p-3 text-sm font-medium text-forest">
          <CheckCircle2 className="size-4" /> Profile saved.
        </div>
      )}

      <form action={updateOrg} className="space-y-8">
        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Basics</h2>
          <div className="space-y-1.5">
            <Label htmlFor="name">Organization name</Label>
            <Input id="name" name="name" required defaultValue={org.name} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about_md">About</Label>
            <Textarea id="about_md" name="about_md" defaultValue={org.about_md ?? ""} className="min-h-[120px]" placeholder="What does your organization do?" />
            <p className="text-xs text-meta">Markdown supported. Shown on your public profile.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">Contact email</Label>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={org.contact_email ?? ""} placeholder="partners@example.org" />
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Signing authority</h2>
            <p className="text-sm text-body">The person who certifies volunteer hours on the work-hours certification.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="signing_authority_name">Name</Label>
              <Input id="signing_authority_name" name="signing_authority_name" defaultValue={org.signing_authority_name ?? ""} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signing_authority_title">Title</Label>
              <Input id="signing_authority_title" name="signing_authority_title" defaultValue={org.signing_authority_title ?? ""} placeholder="Program Director" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-lg border border-line bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Address</h2>
          <div className="space-y-1.5">
            <Label htmlFor="line1">Street address</Label>
            <Input id="line1" name="line1" defaultValue={addr.line1 ?? ""} placeholder="2940 16th Street" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="line2">Suite / unit (optional)</Label>
            <Input id="line2" name="line2" defaultValue={addr.line2 ?? ""} placeholder="Suite 200" />
          </div>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={addr.city ?? ""} placeholder="Sacramento" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" defaultValue={addr.state ?? ""} placeholder="CA" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip">ZIP</Label>
              <Input id="zip" name="zip" defaultValue={addr.zip ?? ""} placeholder="94103" />
            </div>
          </div>
        </section>

        <Button type="submit">Save profile</Button>
      </form>
    </div>
  );
}
