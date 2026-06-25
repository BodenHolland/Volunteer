import Link from "next/link";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getLocale } from "@/lib/i18n";

export async function AuthShell({
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
  const locale = await getLocale();
  return (
    <main className="min-h-screen bg-[#f7fafc]">
      <header className="border-b border-navy-deep bg-navy">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center px-4 md:px-6">
          <Link href="/" className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Logo size={24} className="text-xl text-white" />
          </Link>
        </div>
      </header>
      <div className="flex flex-col items-center px-4 py-12 md:py-16">
      <div className="w-full max-w-[420px] rounded-lg border border-line bg-white p-8 shadow-sm">
        <h1 className="service-heading text-2xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-body">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-sm text-body">{footer}</div>}
      <div className="mt-6"><LocaleSwitcher locale={locale} /></div>
      </div>
    </main>
  );
}
