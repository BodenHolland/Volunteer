/**
 * Outbound notifications. The flows are real; the actual delivery is stubbed
 * until a provider is wired (you chose "build flows, no real sends yet").
 *
 * TODO(provider): implement sendEmail via your chosen HTTP email API and sendSms
 * via Twilio Verify. Both are gated here so nothing else needs to change when the
 * provider lands — set the env keys and replace the stub bodies.
 */
import { headers } from "next/headers";

export interface OutboundEmail {
  to: string;
  subject: string;
  text: string;
}
export interface OutboundSms {
  to: string;
  text: string;
}

export async function sendEmail(msg: OutboundEmail): Promise<void> {
  // TODO(provider): POST to email API. For now, log so flows are testable.
  console.log(`[email:stub] to=${msg.to} subject="${msg.subject}"\n${msg.text}`);
}

export async function sendSms(msg: OutboundSms): Promise<void> {
  // TODO(provider): Twilio Verify. For now, log so OTP flows are testable.
  console.log(`[sms:stub] to=${msg.to} ${msg.text}`);
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
  return process.env.NODE_ENV === "production" ? "https://tended.xkbtrjm2bm.workers.dev" : "http://localhost:3000";
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
