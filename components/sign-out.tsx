"use client";

import { useRef } from "react";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOut } from "@/app/auth-actions";

/**
 * Sign-out controls that submit a POST (server action), never a GET link.
 *
 * A GET-based logout (the old `<Link href="/signout">`) was being fired by
 * Next.js <Link> prefetch and browser predictive prefetch, silently revoking
 * the session in the background. The user still saw their name in the header
 * (rendered while the session was alive) but the next navigation bounced to
 * /login. A form/server action only runs on an explicit submit and is never
 * prefetched, so this can't happen.
 */

/** Sign-out as a Radix dropdown menu item. */
export function SignOutMenuItem({ label = "Sign out" }: { label?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <>
      <form ref={formRef} action={signOut} className="hidden" />
      <DropdownMenuItem destructive onSelect={() => formRef.current?.requestSubmit()}>
        <LogOut /> {label}
      </DropdownMenuItem>
    </>
  );
}

/** Sign-out as a standalone button (mobile menus, etc.). */
export function SignOutButton({ className, label = "Sign out" }: { className?: string; label?: string }) {
  return (
    <form action={signOut} className="contents">
      <button type="submit" className={className}>
        <LogOut /> {label}
      </button>
    </form>
  );
}
