import Link from "next/link";
import { Logo } from "@/components/logo";
import { getDict } from "@/lib/i18n";

export async function SiteFooter() {
  const { t } = await getDict();
  return (
    <footer className="border-t border-line bg-section">
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-body">{t.footer.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            <Link href="/how-it-works" className="text-body hover:text-forest">{t.nav.howItWorks}</Link>
            <Link href="/about" className="text-body hover:text-forest">{t.nav.about}</Link>
            <Link href="/for-organizations" className="text-body hover:text-forest">{t.nav.forOrgs}</Link>
            <Link href="/deliverables" className="text-body hover:text-forest">{t.footer.deliverables}</Link>
            <Link href="/how-it-works#calfresh" className="text-body hover:text-forest">CalFresh &amp; CF 888</Link>
            <Link href="/how-it-works#identity" className="text-body hover:text-forest">{t.footer.privacy}</Link>
            <Link href="/contact" className="text-body hover:text-forest">{t.footer.contact}</Link>
          </div>
        </div>
        <div className="mt-8 border-t border-line pt-6 text-xs text-meta">
          <p>{t.footer.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
