export function DraftBanner() {
  return (
    <div className="border-b border-amber-300 bg-amber-50 text-amber-900">
      <div className="mx-auto max-w-[1200px] px-4 py-3 text-sm md:px-6">
        <strong className="font-semibold">DRAFT —</strong> pending counsel review
        and 501(c)(3) determination. Content describes Tended's intended
        operating posture and is not yet live.
      </div>
    </div>
  );
}

export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[0.9em] text-amber-900 ring-1 ring-amber-300">
      {children}
    </span>
  );
}

export function AuthorityBadge({
  level,
}: {
  level: "direct" | "analogical" | "unaddressed";
}) {
  const styles = {
    direct: {
      label: "Direct authority",
      cls: "bg-green-50 text-green-900 ring-green-200",
    },
    analogical: {
      label: "Analogical",
      cls: "bg-yellow-50 text-yellow-900 ring-yellow-300",
    },
    unaddressed: {
      label: "Unaddressed-but-defensible",
      cls: "bg-orange-50 text-orange-900 ring-orange-300",
    },
  }[level];
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[0.85em] font-medium ring-1 ${styles.cls}`}
    >
      {styles.label}
    </span>
  );
}
