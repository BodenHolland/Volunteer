import { formatHours } from "@/lib/time";

/**
 * Donut showing certified (forest) + pending (amber) against a monthly target.
 */
export function ProgressRing({
  certified,
  pending,
  target,
  size = 168,
  caption,
  sub,
}: {
  certified: number;
  pending: number;
  target: number;
  size?: number;
  caption: string;
  sub?: string;
}) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const certFrac = Math.min(1, certified / target);
  const pendFrac = Math.min(1, (certified + pending) / target);
  const center = size / 2;

  const summary = `${formatHours(certified + pending)} of ${target} hours: ${formatHours(
    certified
  )} certified, ${formatHours(pending)} pending review.`;

  return (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={summary}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true" focusable="false">
          <circle cx={center} cy={center} r={r} fill="none" stroke="var(--color-line)" strokeWidth={stroke} />
          {/* pending arc (drawn first, underneath) */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="var(--color-amber)"
            strokeWidth={stroke}
            strokeDasharray={`${pendFrac * c} ${c}`}
            strokeLinecap="round"
          />
          {/* certified arc on top */}
          <circle
            cx={center}
            cy={center}
            r={r}
            fill="none"
            stroke="var(--color-forest)"
            strokeWidth={stroke}
            strokeDasharray={`${certFrac * c} ${c}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-ink">{formatHours(certified + pending)}</span>
          <span className="text-sm text-meta">of {target}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-base font-medium text-ink">{caption}</p>
        {sub && <p className="mt-1 text-sm text-body">{sub}</p>}
        <div className="mt-3 space-y-1.5 text-sm">
          <span className="flex items-center gap-2 text-body">
            <span className="inline-block size-3 rounded-full bg-forest" /> {formatHours(certified)} certified
          </span>
          <span className="flex items-center gap-2 text-body">
            <span className="inline-block size-3 rounded-full bg-amber" /> {formatHours(pending)} pending review
          </span>
        </div>
      </div>
    </div>
  );
}
