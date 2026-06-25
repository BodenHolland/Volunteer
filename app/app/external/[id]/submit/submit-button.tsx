"use client";

import { useFormStatus } from "react-dom";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Submit button for the Zooniverse certificate form. The AI cross-check
 * runs server-side and can take 25 seconds; without a pending state the
 * button looks broken. Uses React 19's useFormStatus so we don't have to
 * thread loading state through a controlled form.
 */
export function CertificateSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="animate-spin" /> Verifying your certificate…
        </>
      ) : (
        <>
          <Send /> Submit for verification
        </>
      )}
    </Button>
  );
}
