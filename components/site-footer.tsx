import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-section">
      <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-3 text-sm text-body">
              Real civic work for your neighborhood — with a path to certify CalFresh hours.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            <Link href="/how-it-works" className="text-body hover:text-forest">How it works</Link>
            <Link href="/about" className="text-body hover:text-forest">About</Link>
            <Link href="/for-organizations" className="text-body hover:text-forest">For organizations</Link>
            <Link href="/how-it-works#calfresh" className="text-body hover:text-forest">CalFresh &amp; CF 888</Link>
            <Link href="/how-it-works#identity" className="text-body hover:text-forest">Privacy</Link>
            <Link href="/contact" className="text-body hover:text-forest">Contact</Link>
          </div>
        </div>
        <div className="mt-8 border-t border-line pt-6 text-xs text-meta">
          <p>Pilot demo. Not affiliated with the State of California or SF HSA. No real accounts or state submissions. Partnerships shown are illustrative.</p>
        </div>
      </div>
    </footer>
  );
}
