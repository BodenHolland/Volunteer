"use client";

/**
 * Client-side Firebase app + Auth, initialized from NEXT_PUBLIC_FIREBASE_* env
 * (inlined at build time). `firebaseEnabled` is false until the config is present,
 * so the app falls back to the built-in D1 email+password form until then.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

export const firebaseEnabled = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

export function getFirebaseAuth(): Auth | null {
  if (!firebaseEnabled) return null;
  if (!app) app = getApps()[0] ?? initializeApp(config as Record<string, string>);
  if (!authInstance) authInstance = getAuth(app);
  return authInstance;
}
