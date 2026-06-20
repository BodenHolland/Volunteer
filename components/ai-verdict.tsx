import { Sparkles, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { verdictLabel, type AiVerdict } from "@/lib/ai";
import { cn } from "@/lib/utils";

const STYLE = {
  approve: { cls: "border-forest/30 bg-forest-subtle", text: "text-forest", Icon: CheckCircle2 },
  flag: { cls: "border-amber/30 bg-amber-subtle", text: "text-amber", Icon: AlertCircle },
  reject: { cls: "border-brick/30 bg-brick-subtle", text: "text-brick", Icon: XCircle },
};

export function AiVerdictBox({ verdict }: { verdict: AiVerdict }) {
  const s = STYLE[verdict.verdict];
  return (
    <div className={cn("rounded-lg border p-4", s.cls)} aria-live="polite">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-meta" />
        <span className="overline">AI check</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <s.Icon className={cn("size-5", s.text)} />
        <p className={cn("text-base font-semibold", s.text)}>{verdictLabel(verdict.verdict)}</p>
        {verdict.confidence > 0 && (
          <span className="text-xs text-meta">· {Math.round(verdict.confidence * 100)}% confidence</span>
        )}
      </div>
      <p className="mt-2 text-sm text-ink">{verdict.reasoning}</p>
      {verdict.issues.length > 0 && (
        <ul className="mt-2 ml-4 list-disc text-sm text-body">
          {verdict.issues.map((i, idx) => (
            <li key={idx}>{i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
