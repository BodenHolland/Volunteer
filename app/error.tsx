"use client";

import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-section px-4 text-center">
      <Link href="/" className="mb-8"><Logo size={24} className="text-xl" /></Link>
      <div className="w-full max-w-[460px] rounded-lg border border-line bg-white p-8">
        <h1 className="text-2xl font-semibold text-ink">Something went wrong</h1>
        <p className="mt-2 text-body">An unexpected error occurred. You can try again.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => reset()}>Try again</Button>
          <Button asChild variant="secondary"><Link href="/">Back to home</Link></Button>
        </div>
      </div>
    </main>
  );
}
