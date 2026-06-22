"use client";

import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({ label = "Submit", pendingLabel = "Submitting…" }: { label?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      <Send /> {pending ? pendingLabel : label}
    </Button>
  );
}
