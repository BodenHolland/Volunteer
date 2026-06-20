import Link from "next/link";
import { Logo } from "@/components/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-section px-4 py-10">
      <Link href="/" className="mb-8">
        <Logo size={24} className="text-xl" />
      </Link>
      <div className="w-full max-w-[420px] rounded-lg border border-line bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-body">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-body">{footer}</div>}
    </main>
  );
}
