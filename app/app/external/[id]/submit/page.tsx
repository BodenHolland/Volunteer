import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getSubmission } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ZOONIVERSE_ATTESTATION, reportingMonth } from "@/lib/zooniverse";
import { submitCertificate } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Upload certificate — colift" };

export default async function SubmitCertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const me = await requireRecipient();
  const sub = await getSubmission(id);
  if (!sub) notFound();
  if (sub.user_id !== me.id) redirect("/unauthorized");
  if (sub.task.evidence_mode !== "external_certificate") {
    redirect(`/app/projects/${id}/submit`);
  }
  if (sub.status !== "committed" && sub.status !== "in_progress" && sub.status !== "needs_changes") {
    redirect(`/app/external/${id}`);
  }

  const month = reportingMonth(Date.now());

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/app/external/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:underline">
        <ArrowLeft className="size-4" /> Back to task
      </Link>

      <h1 className="text-[28px] font-semibold leading-tight text-ink">Upload your Zooniverse evidence</h1>
      <p className="mt-1 text-sm text-body">
        Three pieces of evidence make verification fast and resistant to forgery. A reviewer cross-checks them
        and credits the hours Zooniverse recorded.
      </p>

      {sp.error && (
        <p className="mt-4 rounded-md border border-brick/30 bg-brick-subtle p-3 text-sm text-brick">
          {sp.error}
        </p>
      )}

      <form action={submitCertificate} encType="multipart/form-data" className="mt-6 space-y-5">
        <input type="hidden" name="submission_id" value={id} />

        <div>
          <Label htmlFor="reporting_month" className="mb-1.5">Reporting month</Label>
          <Input id="reporting_month" name="reporting_month" type="month" defaultValue={month} required />
          <p className="mt-1 text-xs text-meta">Which month should these hours count toward?</p>
        </div>

        <div>
          <Label htmlFor="project_name" className="mb-1.5">Which Zooniverse project?</Label>
          <Input
            id="project_name"
            name="project_name"
            required
            maxLength={120}
            placeholder="e.g. Snapshot Serengeti"
          />
          <p className="mt-1 text-xs text-meta">The project name as it appears on Zooniverse.</p>
        </div>

        <div>
          <Label htmlFor="project_slug" className="mb-1.5">Project URL or slug (optional)</Label>
          <Input
            id="project_slug"
            name="project_slug"
            maxLength={200}
            placeholder="zooniverse/snapshot-serengeti or full URL"
          />
        </div>

        <div>
          <Label htmlFor="profile_url" className="mb-1.5">Your Zooniverse profile URL</Label>
          <Input
            id="profile_url"
            name="profile_url"
            type="url"
            required
            placeholder="https://www.zooniverse.org/users/your-username"
          />
          <p className="mt-1 text-xs text-meta">
            Find this by clicking your avatar on Zooniverse → &quot;Profile&quot;. We open the page to confirm the account matches.
          </p>
        </div>

        <div>
          <Label htmlFor="profile_screenshot" className="mb-1.5">Profile dashboard screenshot</Label>
          <Input
            id="profile_screenshot"
            name="profile_screenshot"
            type="file"
            accept="image/png,image/jpeg"
            required
          />
          <p className="mt-1 text-xs text-meta">
            Screenshot of your Zooniverse profile dashboard showing your username and total classifications.
            PNG or JPG · max 15 MB
          </p>
        </div>

        <div>
          <Label htmlFor="certificate" className="mb-1.5">Volunteer Certificate</Label>
          <Input
            id="certificate"
            name="certificate"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            required
          />
          <p className="mt-1 text-xs text-meta">
            The certificate Zooniverse generated for this month. PDF, PNG, or JPG · max 15 MB
          </p>
        </div>

        <div>
          <Label htmlFor="description" className="mb-1.5">What did you classify?</Label>
          <Textarea
            id="description"
            name="description"
            required
            minLength={25}
            maxLength={500}
            rows={4}
            placeholder="A few sentences about what you saw and how the session went. 25–500 characters."
          />
        </div>

        <div className="rounded-md border border-line bg-section p-4">
          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input type="checkbox" name="attestation" required className="mt-0.5" />
            <span>{ZOONIVERSE_ATTESTATION}</span>
          </label>
        </div>

        <Button type="submit" className="w-full">Submit for review</Button>
      </form>
    </div>
  );
}
