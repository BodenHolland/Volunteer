import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export function StatusPage({
  code,
  title,
  body,
  primary = { href: "/", label: "Back to home" },
  secondary,
}: {
  code?: string;
  title: string;
  body: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-section px-4 text-center">
      <Link href="/" className="mb-8"><Logo size={24} className="text-xl" /></Link>
      <div className="w-full max-w-[460px] rounded-lg border border-line bg-white p-8">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-body">{body}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild><Link href={primary.href}>{primary.label}</Link></Button>
          {secondary && <Button asChild variant="secondary"><Link href={secondary.href}>{secondary.label}</Link></Button>}
        </div>
      </div>
    </main>
  );
}
