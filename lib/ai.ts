/**
 * AI submission validator — OpenRouter (OpenAI-compatible /chat/completions).
 * Pure module: callers pass credentials so it is testable outside the Worker.
 */

export interface AiFieldIssue {
  field: "photos" | "notes" | "overall";
  message: string;
}

export interface AiVerdict {
  verdict: "approve" | "flag" | "reject";
  confidence: number;
  reasoning: string;
  issues: string[];
  estimated_actual_hours: number;
  suspected_ai_content: boolean;
  field_issues?: AiFieldIssue[];
}

/** Routed to pending_review; used when no API key is set. */
export const AI_FALLBACK: AiVerdict = {
  verdict: "flag",
  confidence: 0,
  reasoning: "AI validator unavailable; manual review required",
  issues: [],
  estimated_actual_hours: 0,
  suspected_ai_content: false,
};

export interface AiImage {
  mime: string;
  base64: string;
}

export interface AiInput {
  rubric: string;
  submissionText: string;
  images: AiImage[];
  apiKey?: string;
  model?: string;
  siteUrl?: string;
  appName?: string;
}

const SYSTEM_PROMPT =
  "You are a volunteer-hours validator for a SNAP work-requirement platform. " +
  "Evaluate whether the submission meets the rubric. Return ONLY valid JSON " +
  "matching: { verdict: 'approve'|'flag'|'reject', confidence: number 0-1, " +
  "reasoning: string, issues: string[], estimated_actual_hours: number, " +
  "suspected_ai_content: boolean, " +
  "field_issues: [{field: 'photos'|'notes'|'overall', message: string}] }. " +
  "field_issues must list every fixable problem tied to a specific field — " +
  "'photos' for image quality/count/content issues, 'notes' for written-content issues, " +
  "'overall' for anything else. Be specific and actionable: tell the volunteer exactly what to fix. " +
  "Omit field_issues entirely (empty array) when verdict is 'approve'. No prose outside JSON.";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Map the raw verdict to the human-facing label used in the UI. */
export function verdictLabel(v: AiVerdict["verdict"]): string {
  switch (v) {
    case "approve":
      return "looks complete";
    case "flag":
      return "needs a human look";
    case "reject":
      return "incomplete";
  }
}

function coerceVerdict(raw: unknown): AiVerdict {
  const o = (raw ?? {}) as Record<string, unknown>;
  const verdict =
    o.verdict === "approve" || o.verdict === "reject" ? o.verdict : "flag";
  const confidence =
    typeof o.confidence === "number" ? Math.max(0, Math.min(1, o.confidence)) : 0;
  const rawFieldIssues = Array.isArray(o.field_issues) ? o.field_issues : [];
  const field_issues = rawFieldIssues
    .filter((fi): fi is { field: string; message: string } =>
      typeof fi === "object" && fi !== null && typeof fi.message === "string"
    )
    .map((fi) => ({
      field: (["photos", "notes", "overall"].includes(fi.field) ? fi.field : "overall") as AiFieldIssue["field"],
      message: fi.message,
    }));
  return {
    verdict,
    confidence,
    reasoning: typeof o.reasoning === "string" ? o.reasoning : "No reasoning provided.",
    issues: Array.isArray(o.issues) ? o.issues.map(String) : [],
    estimated_actual_hours:
      typeof o.estimated_actual_hours === "number" ? o.estimated_actual_hours : 0,
    suspected_ai_content: o.suspected_ai_content === true,
    field_issues: field_issues.length > 0 ? field_issues : undefined,
  };
}

export async function validateSubmission(input: AiInput): Promise<AiVerdict> {
  if (!input.apiKey) return AI_FALLBACK;

  const content: unknown[] = [
    {
      type: "text",
      text:
        `RUBRIC:\n${input.rubric}\n\n` +
        `SUBMISSION TEXT:\n${input.submissionText}\n\n` +
        (input.images.length ? "IMAGES BELOW" : "No images attached."),
    },
    ...input.images.map((img) => ({
      type: "image_url",
      image_url: { url: `data:${img.mime};base64,${img.base64}` },
    })),
  ];

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": input.siteUrl ?? "http://localhost:3000",
        "X-Title": input.appName ?? "Tended",
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

    if (!res.ok) return AI_FALLBACK;
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = json.choices?.[0]?.message?.content;
    if (!text) return AI_FALLBACK;
    // Models sometimes wrap JSON in ```; strip fences defensively.
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return coerceVerdict(JSON.parse(cleaned));
  } catch {
    return AI_FALLBACK;
  }
}

/** Fire-and-forget warm-up on /enter so the first real call is fast. */
export async function prewarmOpenRouter(apiKey?: string, model?: string): Promise<void> {
  if (!apiKey) return;
  try {
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model ?? "google/gemini-2.0-flash-exp:free",
        max_tokens: 1,
        messages: [{ role: "user", content: "ping" }],
      }),
    });
  } catch {
    /* ignore */
  }
}
