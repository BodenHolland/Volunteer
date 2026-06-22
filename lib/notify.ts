/**
 * Outbound email. Auth emails (signup verification, password reset) are sent by
 * Firebase client-side; this server path covers org team invites and the legacy
 * D1 password fallback. It sends via Resend when `RESEND_API_KEY` + `EMAIL_FROM`
 * are configured, and otherwise logs the message so flows stay testable locally.
 */
import { headers } from "next/headers";
import { getEnv } from "./cf";

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(msg: OutboundEmail): Promise<void> {
  let apiKey: string | undefined;
  let from: string | undefined;
  try {
    const env = getEnv() as unknown as { RESEND_API_KEY?: string; EMAIL_FROM?: string };
    apiKey = env.RESEND_API_KEY;
    from = env.EMAIL_FROM;
  } catch {
    /* not in a request context */
  }

  if (!apiKey || !from) {
    console.log(`[email:unsent — set RESEND_API_KEY + EMAIL_FROM] to=${msg.to} subject="${msg.subject}"`);
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: msg.to, subject: msg.subject, text: msg.text }),
    });
    if (!res.ok) {
      console.error(`[email:failed] ${res.status} ${await res.text().catch(() => "")}`);
    }
  } catch (e) {
    console.error(`[email:error] ${String(e)}`);
  }
}

/** Best-effort app origin for building links inside server actions. */
export async function appOrigin(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("host");
    if (host) {
      const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
      return `${proto}://${host}`;
    }
  } catch {
    /* ignore */
  }
  try {
    const configured = (getEnv() as unknown as { APP_ORIGIN?: string }).APP_ORIGIN;
    if (configured) return configured;
  } catch {
    /* not in request context */
  }
  return "http://localhost:3000";
}

export function verifyEmailMessage(to: string, link: string): OutboundEmail {
  return {
    to,
    subject: "Confirm your Tended email",
    text: `Welcome to Tended. Confirm your email to finish setting up your account:\n\n${link}\n\nThis link expires in 24 hours. If you didn't sign up, ignore this message.`,
  };
}

export function resetPasswordMessage(to: string, link: string): OutboundEmail {
  return {
    to,
    subject: "Reset your Tended password",
    text: `We received a request to reset your Tended password. Use this link within the next hour:\n\n${link}\n\nIf you didn't request this, you can ignore it — your password won't change.`,
  };
}
