/**
 * Vision validator for a single audit photo.
 *
 * One job per audit_photo. Returns the parsed VisionResult; caller persists
 * to audit_photos.vision_result_json + sets vision_validation_status.
 *
 * Pure module: caller passes credentials. No DB / R2 access here.
 */

import type { BasketItemCategory } from "./food-audit";
import { logEvent } from "./log";

/** Upstream vision calls can hang on the :free tier; cap every fetch at 20s. */
const OPENROUTER_TIMEOUT_MS = 20_000;

export interface VisionResult {
  contains_price_tag: boolean;
  tag_is_readable: boolean;
  ocr_price_value: number | null;
  ocr_price_currency: "USD" | null;
  contains_item: boolean;
  item_category_observed: BasketItemCategory | "unknown";
  confidence: number;
  notes: string;
}

export const VISION_FALLBACK: VisionResult = {
  contains_price_tag: false,
  tag_is_readable: false,
  ocr_price_value: null,
  ocr_price_currency: null,
  contains_item: false,
  item_category_observed: "unknown",
  confidence: 0,
  notes: "Vision validator unavailable; queued for human review.",
};

export interface VisionInput {
  category: BasketItemCategory;
  imageMime: string;
  imageBase64: string;
  apiKey?: string;
  model?: string;
  siteUrl?: string;
  appName?: string;
}

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

function buildPrompt(category: BasketItemCategory): string {
  return (
    `You are validating a photo submitted by a community volunteer auditing food prices in California. ` +
    `The volunteer claims this photo shows a ${category} item alongside its shelf price tag.\n\n` +
    `Return ONLY a JSON object with this exact shape:\n` +
    `{\n` +
    `  "contains_price_tag": boolean,\n` +
    `  "tag_is_readable": boolean,\n` +
    `  "ocr_price_value": number or null,\n` +
    `  "ocr_price_currency": "USD" or null,\n` +
    `  "contains_item": boolean,\n` +
    `  "item_category_observed": "milk" | "eggs" | "bread" | "rice" | "beans" | "produce" | "unknown",\n` +
    `  "confidence": number between 0 and 1,\n` +
    `  "notes": string (one sentence if anything unusual)\n` +
    `}\n\n` +
    `Do not include any text outside the JSON.`
  );
}

const CATEGORY_TO_OBSERVED: Record<string, BasketItemCategory | "unknown"> = {
  milk: "dairy",
  dairy: "dairy",
  eggs: "eggs",
  bread: "bread",
  rice: "rice",
  beans: "beans",
  produce: "produce",
  unknown: "unknown",
};

function coerceVision(raw: unknown): VisionResult {
  const o = (raw ?? {}) as Record<string, unknown>;
  const observed = typeof o.item_category_observed === "string" ? o.item_category_observed : "unknown";
  return {
    contains_price_tag: o.contains_price_tag === true,
    tag_is_readable: o.tag_is_readable === true,
    ocr_price_value:
      typeof o.ocr_price_value === "number" && Number.isFinite(o.ocr_price_value)
        ? o.ocr_price_value
        : null,
    ocr_price_currency: o.ocr_price_currency === "USD" ? "USD" : null,
    contains_item: o.contains_item === true,
    item_category_observed: CATEGORY_TO_OBSERVED[observed] ?? "unknown",
    confidence:
      typeof o.confidence === "number" ? Math.max(0, Math.min(1, o.confidence)) : 0,
    notes: typeof o.notes === "string" ? o.notes : "",
  };
}

export async function validateAuditPhoto(input: VisionInput): Promise<VisionResult> {
  if (!input.apiKey) return VISION_FALLBACK;

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": input.siteUrl ?? "http://localhost:3000",
        "X-Title": input.appName ?? "colift Food Access",
      },
      body: JSON.stringify({
        model: input.model ?? "google/gemini-2.5-flash-lite",
        response_format: { type: "json_object" },
        max_tokens: 512,
        messages: [
          { role: "system", content: "You return only valid JSON. No prose." },
          {
            role: "user",
            content: [
              { type: "text", text: buildPrompt(input.category) },
              {
                type: "image_url",
                image_url: { url: `data:${input.imageMime};base64,${input.imageBase64}` },
              },
            ],
          },
        ],
      }),
      // Without a timeout a slow upstream pins the Worker; degrade to the
      // human-review fallback instead. Never auto-pass on timeout.
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
    });
    if (!res.ok) {
      logEvent("audit_vision_failed", { status: res.status });
      return VISION_FALLBACK;
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content;
    if (!text) return VISION_FALLBACK;
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    return coerceVision(JSON.parse(cleaned));
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError" ? "timeout" : "error";
    logEvent("audit_vision_failed", { reason });
    return VISION_FALLBACK;
  }
}

/** Photo passes if vision returned a readable tag with the right item. */
export function visionPasses(v: VisionResult, expectedCategory: BasketItemCategory): boolean {
  return (
    v.contains_price_tag &&
    v.tag_is_readable &&
    v.contains_item &&
    (v.item_category_observed === expectedCategory || v.item_category_observed === "unknown")
  );
}
