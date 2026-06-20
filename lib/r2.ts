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
