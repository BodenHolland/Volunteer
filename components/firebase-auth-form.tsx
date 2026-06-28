"use client";

import { useState } from "react";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirebaseAuth } from "@/lib/firebase-client";

type ConsentCopy = {
  prefix: string;
  terms: string;
  and: string;
  privacy: string;
  suffix: string;
  required: string;
};

/** Firebase sign-in / sign-up that exchanges the ID token for our D1 session. */
export function FirebaseAuthForm({
  mode,
  next,
  consent,
}: {
  mode: "login" | "signup";
  next?: string;
  consent?: ConsentCopy;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const requireConsent = mode === "signup" && !!consent;

  async function exchange() {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) throw new Error("no session");
    const idToken = await auth.currentUser.getIdToken();
    const res = await fetch("/api/auth/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error("session exchange failed");
    const data = (await res.json()) as { next?: string };
    // Full-page navigation (not router.push): the session cookie was just set
    // via fetch, and a hard load guarantees the next request carries it and is
    // server-rendered fresh — a soft navigation can replay a cached logged-out
    // redirect for the destination and bounce the user back to /login (loop).
    window.location.assign(next || data.next || "/app");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setGoogleError(null);
    setInfo(null);
    if (requireConsent && !agreed) {
      setFormError(consent!.required);
      return;
    }
    setBusy(true);
    const auth = getFirebaseAuth();
    if (!auth) {
      setFormError("Sign-in is not configured.");
      setBusy(false);
      return;
    }
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await sendEmailVerification(cred.user);
        } catch {
          /* non-fatal */
        }
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        // The app gates access on a verified email (see lib/session.ts). If the
        // user hasn't verified yet, don't mint a session that would just bounce
        // them to /login?error=verify — resend the link and tell them.
        if (!cred.user.emailVerified) {
          try {
            await sendEmailVerification(cred.user);
          } catch {
            /* non-fatal */
          }
          setInfo("Please verify your email — we just sent a fresh link. Open it, then sign in again.");
          setBusy(false);
          return;
        }
      }
      await exchange();
    } catch (err) {
      console.error("[auth] email/password sign-in failed", err);
      setFormError(friendly(err));
      setBusy(false);
    }
  }

  async function onGoogle() {
    setFormError(null);
    setGoogleError(null);
    if (requireConsent && !agreed) {
      setGoogleError(consent!.required);
      return;
    }
    setBusy(true);
    const auth = getFirebaseAuth();
    if (!auth) {
      setGoogleError("Sign-in is not configured.");
      setBusy(false);
      return;
    }
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      await exchange();
    } catch (err) {
      console.error("[auth] Google sign-in failed", err);
      setGoogleError(friendly(err));
      setBusy(false);
    }
  }

  async function onReset() {
    setFormError(null);
    setInfo(null);
    const auth = getFirebaseAuth();
    if (!auth || !email) {
      setFormError("Enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err) {
      setFormError(friendly(err));
    }
  }

  return (
    <div className="space-y-4">
      {info && <p className="rounded-md bg-forest-subtle px-3 py-2 text-sm text-forest">{info}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} leadingIcon={<Mail />} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === "login" && (
              <button type="button" onClick={onReset} className="text-sm font-medium text-forest hover:underline">Forgot?</button>
            )}
          </div>
          <Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 6 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} leadingIcon={<Lock />} />
        </div>
        {requireConsent && (
          <label className="flex items-start gap-2 text-sm text-body">
            <input
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 rounded border-line text-forest focus:ring-forest"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              aria-required="true"
            />
            <span>
              {consent!.prefix}{" "}
              <Link href="/terms" target="_blank" rel="noopener" className="text-forest underline">
                {consent!.terms}
              </Link>{" "}
              {consent!.and}{" "}
              <Link href="/privacy" target="_blank" rel="noopener" className="text-forest underline">
                {consent!.privacy}
              </Link>
              {consent!.suffix}
            </span>
          </label>
        )}
        {formError && <p className="text-sm text-brick" role="alert">{formError}</p>}
        <Button type="submit" className="w-full" disabled={busy || (requireConsent && !agreed)}>
          {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-meta">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={onGoogle}
        disabled={busy || (requireConsent && !agreed)}
      >
        Continue with Google
      </Button>
      {googleError && <p className="text-sm text-brick" role="alert">{googleError}</p>}
    </div>
  );
}

function friendly(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found"))
    return "That email and password don't match.";
  if (code.includes("email-already-in-use")) return "An account with that email already exists.";
  if (code.includes("weak-password")) return "Choose a stronger password (at least 6 characters).";
  if (code.includes("too-many-requests")) return "Too many attempts. Try again in a few minutes.";
  if (code.includes("popup-closed") || code.includes("cancelled-popup-request") || code.includes("user-cancelled"))
    return "Sign-in was cancelled.";
  if (code.includes("popup-blocked")) return "Your browser blocked the sign-in popup. Allow popups for this site and try again.";
  if (code.includes("unauthorized-domain"))
    return "This site isn't authorized for Google sign-in yet. (Add the domain in Firebase → Auth → Settings.)";
  if (code.includes("account-exists-with-different-credential"))
    return "An account with that email already exists with a different sign-in method.";
  if (code.includes("network-request-failed")) return "Network error. Check your connection and try again.";
  if (code.includes("operation-not-allowed"))
    return "This sign-in method isn't enabled. (Enable Google in Firebase → Auth → Sign-in method.)";
  return "Something went wrong. Please try again.";
}
