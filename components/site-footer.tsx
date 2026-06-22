import Link from "next/link";
import { Logo } from "@/components/logo";
import { getDict } from "@/lib/i18n";

export async function SiteFooter() {
  const { t } = await getDict();
  return (
    <footer className="border-t border-navy-deep bg-navy text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo className="text-white" />
            <p className="mt-3 text-sm text-blue-100">{t.footer.tagline}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            <Link href="/how-it-works" className="text-blue-100 hover:text-white">{t.nav.howItWorks}</Link>
            <Link href="/about" className="text-blue-100 hover:text-white">{t.nav.about}</Link>
            <Link href="/for-organizations" className="text-blue-100 hover:text-white">{t.nav.forOrgs}</Link>
            <Link href="/deliverables" className="text-blue-100 hover:text-white">{t.footer.deliverables}</Link>
            <Link href="/how-it-works" className="text-blue-100 hover:text-white">{t.footer.snapEbt}</Link>
            <Link href="/how-it-works#identity" className="text-blue-100 hover:text-white">{t.footer.privacy}</Link>
            <Link href="/help" className="text-blue-100 hover:text-white">{t.footer.help}</Link>
            <Link href="/contact" className="text-blue-100 hover:text-white">{t.footer.contact}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
