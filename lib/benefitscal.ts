/**
 * Tier-3 enrollment verification — read an uploaded BenefitsCal/CalFresh
 * screenshot with the OpenRouter vision model and compare against the
 * recipient's entered Section-1 PII.
 *
 * Pure module: the caller passes credentials (so it is testable outside the
 * Worker) and the already-decrypted expected name/case number. Key-gated like
 * the other integrations: with no `apiKey` (dev default) it returns a graceful
 * "manual review" result and never throws — the onboarding demo keeps working.
 *
 * Mirrors lib/ai.ts's OpenRouter call pattern (headers, json_object
 * response_format, max_tokens, fence-stripping, try/catch). Replicated, not
 * imported, on purpose.
 */
import { getFile } from "./r2";

export interface BenefitsCalResult {
  verified: boolean;
  confidence: number;
  reasoning: string;
  matched: {
    name: boolean;
    case_number: boolean;
    calfresh_mention: boolean;
  };
}

export interface BenefitsCalInput {
  r2Key: string;
  expectedName?: string | null;
  expectedCaseNumber?: string | null;
  apiKey?: string;
  model?: string;
  siteUrl?: string;
  appName?: string;
}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM_PROMPT =
  "You are an enrollment-verification assistant for a SNAP/CalFresh work-requirement platform. " +
  "You are shown a screenshot the applicant uploaded that should be their BenefitsCal account / " +
  "CalFresh case page, plus the name and case number they self-reported. Decide whether the image " +
  "is a genuine BenefitsCal/CalFresh screenshot and whether it corroborates the reported identity. " +
  "Be strict: only mark a field matched when the screenshot actually shows that value. " +
  "Return ONLY valid JSON matching: { verified: boolean, confidence: number 0-1, reasoning: string, " +
  "matched: { name: boolean, case_number: boolean, calfresh_mention: boolean } }. " +
  "Set verified true only when the image is plausibly a BenefitsCal/CalFresh screenshot AND at least " +
  "one of name or case_number matches the reported value. No prose outside JSON.";

/** Routed to manual review; demo works with no API key or on any error. */
function manualReview(reasoning: string): BenefitsCalResult {
  return {
    verified: false,
    confidence: 0,
    reasoning,
    matched: { name: false, case_number: false, calfresh_mention: false },
  };
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function coerceResult(raw: unknown): BenefitsCalResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const m = (o.matched ?? {}) as Record<string, unknown>;
  const confidence =
    typeof o.confidence === "number" ? Math.max(0, Math.min(1, o.confidence)) : 0;
  return {
    verified: o.verified === true,
    confidence,
    reasoning:
      typeof o.reasoning === "string" ? o.reasoning : "No reasoning provided.",
    matched: {
      name: m.name === true,
      case_number: m.case_number === true,
      calfresh_mention: m.calfresh_mention === true,
    },
  };
}

export async function verifyBenefitsCalScreenshot(
  input: BenefitsCalInput
): Promise<BenefitsCalResult> {
  if (!input.apiKey) {
    return manualReview(
      "Enrollment validator unavailable (no API key configured); flagged for manual review."
    );
  }

  let base64: string;
  let mime = "image/png";
  try {
    const obj = await getFile(input.r2Key);
    if (!obj) {
      return manualReview(
        "Could not load the uploaded screenshot from storage; flagged for manual review."
      );
    }
    const buf = await obj.arrayBuffer();
    base64 = toBase64(buf);
    const ct = obj.httpMetadata?.contentType;
    if (ct) mime = ct;
  } catch {
    return manualReview(
      "Error reading the uploaded screenshot; flagged for manual review."
    );
  }

  const content: unknown[] = [
    {
      type: "text",
      text:
        "Reported applicant name: " +
        (input.expectedName?.trim() || "(not provided)") +
        "\nReported case number: " +
        (input.expectedCaseNumber?.trim() || "(not provided)") +
        "\n\nScreenshot below — verify it is a BenefitsCal/CalFresh account page and whether the " +
        "reported name and case number appear in it.",
    },
    {
      type: "image_url",
      image_url: { url: `data:${mime};base64,${base64}` },
    },
  ];

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": input.siteUrl ?? "http://localhost:3000",
        "X-Title": input.appName ?? "Tended Demo",
      },
      body: JSON.stringify({
        model: input.model ?? "google/gemini-2.0-flash-exp:free",
        response_format: { type: "json_object" },
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content },
        ],
      }),
    });

    if (!res.ok) {
      return manualReview(
        "Enrollment validator returned an error; flagged for manual review."
      );
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content;
    if (!text) {
      return manualReview(
        "Enrollment validator returned no content; flagged for manual review."
      );
    }
    // Models sometimes wrap JSON in ```; strip fences defensively.
    const cleaned = text
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    return coerceResult(JSON.parse(cleaned));
  } catch {
    return manualReview(
      "Enrollment validator could not be reached; flagged for manual review."
    );
  }
}
