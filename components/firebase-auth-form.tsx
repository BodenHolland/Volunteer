"use client";

import { useState } from "react";
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

/** Firebase sign-in / sign-up that exchanges the ID token for our D1 session. */
export function FirebaseAuthForm({ mode, next }: { mode: "login" | "signup"; next?: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    setError(null);
    setInfo(null);
    setBusy(true);
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Sign-in is not configured.");
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
        await signInWithEmailAndPassword(auth, email, password);
      }
      await exchange();
    } catch (err) {
      setError(friendly(err));
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    setBusy(true);
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      await exchange();
    } catch (err) {
      setError(friendly(err));
      setBusy(false);
    }
  }

  async function onReset() {
    setError(null);
    setInfo(null);
    const auth = getFirebaseAuth();
    if (!auth || !email) {
      setError("Enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(friendly(err));
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
        {error && <p className="text-sm text-brick" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-meta">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
      <Button type="button" variant="secondary" className="w-full" onClick={onGoogle} disabled={busy}>
        Continue with Google
      </Button>
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
  if (code.includes("popup-closed")) return "Sign-in was cancelled.";
  return "Something went wrong. Please try again.";
}
