import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { requireRecipient } from "@/lib/session";
import { getSubmission } from "@/lib/queries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ZOONIVERSE_ATTESTATION, reportingMonth } from "@/lib/zooniverse";
import { CertificateSubmitButton } from "./submit-button";
import { submitCertificate } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Upload certificate | colift" };

export default async function SubmitCertificatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  // Next.js delivers repeated query params as string[], that's how we surface
  // multiple AI-mismatch issues to the user at once.
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const errors = Array.isArray(sp.error) ? sp.error : sp.error ? [sp.error] : [];
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

      <h1 className="text-[28px] font-semibold leading-tight text-ink">Upload your Zooniverse certificate</h1>
      <p className="mt-1 text-sm text-body">
        We&apos;ll auto-check the certificate against your profile and self-reported hours. If everything
        matches, hours land in your ledger immediately. If anything looks off, a reviewer takes a look.
      </p>

      {errors.length > 0 && (
        <div className="mt-4 rounded-md border border-brick/30 bg-brick-subtle p-4 text-sm text-brick">
          <p className="mb-2 flex items-center gap-1.5 font-semibold">
            <AlertCircle className="size-4" />
            {errors.length === 1
              ? "We couldn't auto-verify this submission"
              : `${errors.length} things to fix before we can auto-verify`}
          </p>
          <ul className="ml-5 list-disc space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-brick/80">
            Adjust the fields below and resubmit. Nothing was saved yet.
          </p>
        </div>
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
            Click your avatar on Zooniverse → &quot;Profile&quot; and copy the URL.
          </p>
        </div>

        <div>
          <Label htmlFor="reported_hours" className="mb-1.5">Hours you volunteered this month</Label>
          <Input
            id="reported_hours"
            name="reported_hours"
            type="number"
            min="0.1"
            max="9.99"
            step="0.1"
            required
            placeholder="e.g. 2.5"
            className="w-32"
          />
          <p className="mt-1 text-xs text-meta">
            Type the same number that appears on your certificate. Up to 9.99 in 0.1 increments.
          </p>
        </div>

        <div>
          <Label htmlFor="certificate" className="mb-1.5">Volunteer Certificate</Label>
          <Input
            id="certificate"
            name="certificate"
            type="file"
            accept="image/png,image/jpeg"
            required
          />
          <p className="mt-1 text-xs text-meta">
            A screenshot or image export of the certificate Zooniverse generated this month.
            PNG or JPG — max 15 MB.
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
            placeholder="A few sentences about what you saw and how the session went. 25500 characters."
          />
        </div>

        <div className="rounded-md border border-line bg-section p-4">
          <label className="flex items-start gap-2.5 text-sm text-ink">
            <input type="checkbox" name="attestation" required className="mt-0.5" />
            <span>{ZOONIVERSE_ATTESTATION}</span>
          </label>
        </div>

        <CertificateSubmitButton />
      </form>
    </div>
  );
}
