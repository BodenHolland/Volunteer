/**
 * Edge verification of Firebase Auth ID tokens (no Admin SDK — it doesn't run on
 * Workers). Firebase ID tokens are RS256 JWTs signed with Google's rotating x509
 * certs. We fetch those certs, verify the signature + issuer/audience, and return
 * the identity. Certs are cached in module memory honoring their Cache-Control.
 */
import { importX509, jwtVerify, decodeProtectedHeader } from "jose";
import { getEnv } from "./cf";

const CERT_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let certCache: { certs: Record<string, string>; expires: number } | null = null;

async function getCerts(): Promise<Record<string, string>> {
  if (certCache && certCache.expires > Date.now()) return certCache.certs;
  const res = await fetch(CERT_URL);
  if (!res.ok) throw new Error(`firebase certs fetch failed: ${res.status}`);
  const certs = (await res.json()) as Record<string, string>;
  const cc = res.headers.get("cache-control") ?? "";
  const maxAge = Number(/max-age=(\d+)/.exec(cc)?.[1] ?? 3600);
  certCache = { certs, expires: Date.now() + maxAge * 1000 };
  return certs;
}

function projectId(): string | undefined {
  const env = getEnv() as unknown as { FIREBASE_PROJECT_ID?: string; NEXT_PUBLIC_FIREBASE_PROJECT_ID?: string };
  // Runtime bindings are the source of truth on Workers. The build-time public
  // value is a safe fallback for route handlers where OpenNext has not yet
  // initialized the request context (otherwise Firebase signs in successfully
  // but the server rejects its token and never creates a Tended session).
  return env.FIREBASE_PROJECT_ID || env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
}

export interface FirebaseIdentity {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
}

/** Returns the verified identity, or null if the token is missing/invalid. */
export async function verifyFirebaseToken(token: string | null | undefined): Promise<FirebaseIdentity | null> {
  const pid = projectId();
  if (!token || !pid) return null;
  try {
    const { kid } = decodeProtectedHeader(token);
    if (!kid) return null;
    const certs = await getCerts();
    const pem = certs[kid];
    if (!pem) return null;
    const key = await importX509(pem, "RS256");
    const { payload } = await jwtVerify(token, key, {
      issuer: `https://securetoken.google.com/${pid}`,
      audience: pid,
    });
    if (!payload.sub) return null;
    return {
      uid: String(payload.sub),
      email: (payload.email as string) ?? null,
      emailVerified: payload.email_verified === true,
      phone: (payload.phone_number as string) ?? null,
    };
  } catch (error) {
    // Keep the token private, but surface the verification failure in Workers
    // logs. Without this, an auth loop is indistinguishable from a bad login.
    console.warn("[firebase_token_verification_failed]", error instanceof Error ? error.message : String(error));
    return null;
  }
}
