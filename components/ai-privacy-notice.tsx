import { ShieldAlert } from "lucide-react";
import type { Locale } from "@/lib/i18n";

/**
 * Privacy notice shown wherever a user enters work that an automated (AI) review
 * system will read — submission notes/answers and uploaded photos are sent to a
 * third-party model for validation, so users should keep personal information
 * out of them. Presentational + server-safe (no hooks); pass the current locale.
 */
const COPY = {
  en: {
    title: "Keep personal info out of your submission",
    body: "An automated (AI) system reviews your work. Please don't include personal information — your name, case number, address, phone number, or anyone else's — in your notes, answers, or photos.",
  },
  es: {
    title: "No incluyas datos personales en tu envío",
    body: "Un sistema automatizado (IA) revisa tu trabajo. Por favor no incluyas información personal — tu nombre, número de caso, dirección, teléfono, ni la de otra persona — en tus notas, respuestas o fotos.",
  },
} as const;

export function AiPrivacyNotice({ locale, className }: { locale: Locale; className?: string }) {
  const c = COPY[locale];
  return (
    <div
      role="note"
      className={`flex items-start gap-2.5 rounded-lg border border-amber/30 bg-amber-subtle p-3 text-sm${className ? ` ${className}` : ""}`}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden="true" />
      <div>
        <p className="font-medium text-ink">{c.title}</p>
        <p className="mt-0.5 text-body">{c.body}</p>
      </div>
    </div>
  );
}
