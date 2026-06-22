import { ShieldCheck, ShieldAlert, Sparkles, Inbox, Scale, ListChecks } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { getEnv } from "@/lib/cf";
import {
  getInvariantViolations,
  getGateViolations,
  getAiBacklog,
  type InvariantViolation,
  type GateViolation,
} from "@/lib/observability";
import { formatHours } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "System health — Tended admin" };

function Stat({ icon, value, label, hint }: { icon: React.ReactNode; value: string | number; label: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 [&_svg]:size-5">
      <div className="flex items-center gap-2 text-meta">{icon}<span className="overline">{label}</span></div>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-sm text-meta">{hint}</p>}
    </div>
  );
}

function MonitorPanel({
  ok,
  okTitle,
  okBody,
  failTitle,
  children,
}: {
  ok: boolean;
  okTitle: string;
  okBody: string;
  failTitle: string;
  children?: React.ReactNode;
}) {
  if (ok) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-forest/30 bg-forest-subtle p-5">
        <ShieldCheck className="mt-0.5 size-6 shrink-0 text-forest" />
        <div>
          <p className="text-base font-semibold text-forest">{okTitle}</p>
          <p className="mt-1 text-sm text-body">{okBody}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-brick/40 bg-brick-subtle p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-6 shrink-0 text-brick" />
        <div className="flex-1">
          <p className="text-base font-semibold text-brick">{failTitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

export default async function AdminSystemPage() {
  await requireAdmin();

  // (a) AI validator availability — presence only, never the key itself.
  let aiKeyPresent = false;
  try {
    aiKeyPresent = Boolean(getEnv().OPENROUTER_API_KEY);
  } catch {
    aiKeyPresent = false;
  }

  // (b) queue backlog proxy, (c) hard-line #1, (d) hard-line #2.
  const [aiBacklog, invariantViolations, gateViolations] = await Promise.all([
    getAiBacklog(),
    getInvariantViolations(),
    getGateViolations(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[28px] font-semibold text-ink">System health</h1>
        <p className="mt-1 text-body">Service availability and the two legal-invariant monitors.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Stat
          icon={<Sparkles />}
          value={aiKeyPresent ? "Configured" : "Not set"}
          label="AI validator"
          hint={aiKeyPresent ? "OPENROUTER_API_KEY present" : "Falls back to manual review"}
        />
        <Stat
          icon={<Inbox />}
          value={aiBacklog}
          label="AI review backlog"
          hint="Submissions stuck in ai_reviewing"
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-ink [&_svg]:size-5">
          <Scale />
          <h2 className="text-[22px] font-semibold">Hard line #1 — credited never exceeds measured</h2>
        </div>
        <MonitorPanel
          ok={invariantViolations.length === 0}
          okTitle="No violations — credited never exceeds measured"
          okBody="Every approved submission credits hours at or below the volunteer's measured active time. The CF 888 attestation holds."
          failTitle={`${invariantViolations.length} violation${invariantViolations.length === 1 ? "" : "s"} — credited exceeds measured time`}
        >
          <p className="mt-1 text-sm text-body">
            These approved submissions credit more hours than the volunteer actually worked. This is false attestation
            and must be corrected immediately.
          </p>
          <ul className="mt-3 divide-y divide-brick/20 overflow-hidden rounded-md border border-brick/20 bg-white">
            {invariantViolations.map((v: InvariantViolation) => (
              <li key={v.id} className="flex flex-col gap-1 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-ink">{v.title ?? "Submission"} · {v.full_name ?? "A volunteer"}</span>
                <span className="text-brick">
                  credited {formatHours(v.hours_credited)}h &gt; measured {formatHours(v.measured_hours)}h
                </span>
              </li>
            ))}
          </ul>
        </MonitorPanel>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-ink [&_svg]:size-5">
          <ListChecks />
          <h2 className="text-[22px] font-semibold">Hard line #2 — no task ships without a gate review</h2>
        </div>
        <MonitorPanel
          ok={gateViolations.length === 0}
          okTitle="No violations — every active task passed the 4-part gate"
          okBody="No task template is live without a completed beneficiary-gate review."
          failTitle={`${gateViolations.length} active task${gateViolations.length === 1 ? "" : "s"} without a gate review`}
        >
          <p className="mt-1 text-sm text-body">
            These task templates are live but have no recorded 4-part beneficiary-gate review. They must be reviewed or paused.
          </p>
          <ul className="mt-3 divide-y divide-brick/20 overflow-hidden rounded-md border border-brick/20 bg-white">
            {gateViolations.map((g: GateViolation) => (
              <li key={g.id} className="flex flex-col gap-1 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-ink">{g.title}</span>
                <span className="text-body">{g.org_name ?? "—"}</span>
              </li>
            ))}
          </ul>
        </MonitorPanel>
      </section>
    </div>
  );
}
