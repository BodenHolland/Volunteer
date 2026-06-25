import { FileText, ShieldCheck, ExternalLink, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import type { SubmissionFile, Submission } from "@/lib/types";
import type { ZooniverseAiVerdict } from "@/lib/zooniverse";

export function ExternalEvidence({
  submission,
  files,
}: {
  submission: Submission;
  files: SubmissionFile[];
}) {
  const cert = files.find((f) => f.kind === "zooniverse_certificate");
  let meta: {
    mime?: string;
    size_bytes?: number;
    sha256?: string;
    reporting_month?: string;
    project_name?: string;
    project_slug?: string;
    profile_url?: string;
    reported_hours?: number;
    ai_verdict?: ZooniverseAiVerdict;
  } = {};
  try {
    meta = cert?.metadata_json ? JSON.parse(cert.metadata_json) : {};
  } catch {
    meta = {};
  }
  const isPdf = meta.mime === "application/pdf";
  const previewUrl = cert ? `/api/files?key=${encodeURIComponent(cert.r2_key)}` : null;
  const ai = meta.ai_verdict;

  return (
    <div className="space-y-5">
      {submission.user_notes && (
        <div>
          <p className="mb-1 text-sm font-medium text-ink">Volunteer description</p>
          <p className="whitespace-pre-wrap rounded-lg border border-line bg-white p-4 text-sm leading-relaxed text-ink">
            {submission.user_notes}
          </p>
        </div>
      )}

      {ai && (
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <Sparkles className="size-4 text-forest" /> AI cross-check
            {ai.auto_approve ? (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-forest-subtle px-2 py-0.5 text-xs font-medium text-forest">
                <CheckCircle2 className="size-3" /> Auto-approve eligible
              </span>
            ) : (
              <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-subtle px-2 py-0.5 text-xs font-medium text-amber">
                <AlertCircle className="size-3" /> Needs reviewer
              </span>
            )}
          </p>
          <p className="mt-2 text-xs text-body">{ai.reasoning}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-meta">Name on cert (extracted)</dt>
              <dd className="font-medium text-ink">{ai.extracted_cert_name ?? ""}</dd>
            </div>
            <div>
              <dt className="text-meta">Hours on cert (extracted)</dt>
              <dd className="font-medium text-ink">{ai.extracted_cert_hours ?? ""}</dd>
            </div>
            <div>
              <dt className="text-meta">Name match</dt>
              <dd className="font-medium text-ink">{ai.name_match ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-meta">Hours match</dt>
              <dd className="font-medium text-ink">{ai.hours_match ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="text-meta">Profile consistent</dt>
              <dd className="font-medium text-ink">{ai.profile_consistent ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>
      )}

      <div>
        <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink">
          <ExternalLink className="size-4 text-forest" /> Zooniverse profile URL
        </p>
        {meta.profile_url ? (
          <a
            href={meta.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block break-all rounded-lg border border-line bg-white p-3 text-sm text-forest underline-offset-2 hover:underline"
          >
            {meta.profile_url}
          </a>
        ) : (
          <p className="rounded-lg border border-line bg-section p-3 text-sm text-meta">Not provided.</p>
        )}
      </div>

      <div>
        <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-ink">
          <ShieldCheck className="size-4 text-forest" /> Zooniverse Volunteer Certificate
        </p>
        {!cert ? (
          <p className="rounded-lg border border-line bg-section p-4 text-sm text-meta">
            No certificate attached.
          </p>
        ) : isPdf && previewUrl ? (
          <div className="overflow-hidden rounded-lg border border-line bg-white">
            <object data={previewUrl} type="application/pdf" className="h-[640px] w-full">
              <p className="p-4 text-sm text-meta">
                Your browser can&apos;t preview this PDF.{" "}
                <a href={previewUrl} className="text-forest underline">Download the certificate</a>.
              </p>
            </object>
          </div>
        ) : previewUrl ? (
          <div className="overflow-hidden rounded-lg border border-line bg-section p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Zooniverse certificate" className="mx-auto max-h-[640px] object-contain" />
          </div>
        ) : null}

        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-body">
          <div className="col-span-2">
            <dt className="text-meta">Project (volunteer-reported)</dt>
            <dd className="font-medium text-ink">
              {meta.project_name ?? ""}
              {meta.project_slug && (
                <span className="ml-2 text-meta">· {meta.project_slug}</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-meta">Volunteer-reported hours</dt>
            <dd className="font-medium text-ink">{meta.reported_hours ?? ""}</dd>
          </div>
          <div>
            <dt className="text-meta">Reporting month</dt>
            <dd className="font-medium text-ink">{meta.reporting_month ?? ""}</dd>
          </div>
          <div>
            <dt className="text-meta">File type</dt>
            <dd className="font-medium text-ink">{meta.mime ?? ""}</dd>
          </div>
          <div>
            <dt className="text-meta">Size</dt>
            <dd className="font-medium text-ink">
              {meta.size_bytes ? `${Math.round(meta.size_bytes / 1024)} KB` : ""}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-meta">SHA-256</dt>
            <dd className="truncate font-mono text-[10px] text-ink">{meta.sha256 ?? ""}</dd>
          </div>
        </dl>
      </div>

      {files.filter((f) => f.kind !== "zooniverse_certificate").length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink">
            <FileText className="size-4 text-meta" /> Additional files
          </p>
          <ul className="space-y-1 text-sm">
            {files
              .filter((f) => f.kind !== "zooniverse_certificate")
              .map((f) => (
                <li key={f.id}>
                  <a className="text-forest underline" href={`/api/files?key=${encodeURIComponent(f.r2_key)}`}>
                    {f.kind}
                  </a>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
