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

// Firebase project IDs are public identifiers (they are embedded in the web
// client configuration). Keeping this final fallback prevents an OpenNext
// request-context gap from breaking the server half of authentication.
const DEFAULT_FIREBASE_PROJECT_ID = "volunteer-online-bcfa9";

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
  // but the server rejects its token and never creates a colift session).
  return (
    env.FIREBASE_PROJECT_ID ||
    env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    DEFAULT_FIREBASE_PROJECT_ID
  );
}

export interface FirebaseIdentity {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  phone: string | null;
}

/**
 * Verify the token with Firebase's Identity Toolkit. This is the primary
 * verifier in the Workers runtime: it avoids depending on x509 parsing in an
 * isolate while Firebase remains the authority that validates signature,
 * audience, issuer, and expiry. The API key is intentionally public client
 * configuration, not a credential.
 */
async function verifyWithIdentityToolkit(token: string): Promise<FirebaseIdentity | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      users?: Array<{ localId?: string; email?: string; emailVerified?: boolean; phoneNumber?: string }>;
    };
    const user = data.users?.[0];
    if (!user?.localId) return null;
    return {
      uid: user.localId,
      email: user.email ?? null,
      emailVerified: user.emailVerified === true,
      phone: user.phoneNumber ?? null,
    };
  } catch (error) {
    console.warn("[firebase_identity_toolkit_verification_failed]", error instanceof Error ? error.message : String(error));
    return null;
  }
}

/** Returns the verified identity, or null if the token is missing/invalid. */
export async function verifyFirebaseToken(token: string | null | undefined): Promise<FirebaseIdentity | null> {
  if (!token) return null;

  const firebaseIdentity = await verifyWithIdentityToolkit(token);
  if (firebaseIdentity) return firebaseIdentity;

  const pid = projectId();
  if (!pid) return null;
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
