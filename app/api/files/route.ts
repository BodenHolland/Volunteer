import { getFile } from "@/lib/r2";

const PLACEHOLDER = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="#f3eee3"/><g fill="none" stroke="#8a968f" stroke-width="2"><circle cx="200" cy="170" r="46"/><path d="M120 300c20-46 60-70 80-70s60 24 80 70"/></g><text x="200" y="350" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#8a968f">photo</text></svg>`;

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!key) return new Response("missing key", { status: 400 });

  try {
    const obj = await getFile(key);
    if (obj) {
      return new Response(obj.body as ReadableStream, {
        headers: {
          "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }
  } catch {
    /* fall through to placeholder */
  }
  return new Response(PLACEHOLDER, { headers: { "Content-Type": "image/svg+xml" } });
}
