import { getFiles } from "./cf";

export async function putFile(
  key: string,
  data: ArrayBuffer | Uint8Array | ReadableStream,
  contentType: string
): Promise<string> {
  await getFiles().put(key, data as ArrayBuffer, {
    httpMetadata: { contentType },
  });
  return key;
}

export async function getFile(key: string) {
  return getFiles().get(key);
}

/**
 * Permanently delete R2 objects. Used by account erasure to destroy private-
 * cluster PII documents (CF 888 PDFs, BenefitsCal screenshots, provider
 * certificates) — orphaning their DB rows isn't enough; the documents themselves
 * carry legal name / case number / address / DOB. The R2 binding accepts an array
 * of keys; empty/blank keys are filtered out.
 */
export async function deleteFiles(keys: Array<string | null | undefined>): Promise<void> {
  const valid = keys.filter((k): k is string => typeof k === "string" && k.length > 0);
  if (valid.length === 0) return;
  await getFiles().delete(valid);
}
