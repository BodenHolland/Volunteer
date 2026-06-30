import Link from "next/link";
import { LogoMark } from "@/components/logo";
import { getDict } from "@/lib/i18n";

export async function SiteFooter() {
  const { t } = await getDict();
  return (
    <footer className="border-t border-civic-line bg-ink text-paper">
      <div className="mx-auto max-w-[1280px] px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link href="/" aria-label="colift home" className="inline-flex items-center gap-2 text-paper">
              <LogoMark size={26} />
              <span className="text-[18px] font-semibold tracking-tight">colift</span>
            </Link>
            <p className="mt-4 text-[13px] text-paper/55">
              A 501(c)(3) virtual volunteer-coordinating nonprofit.
            </p>
          </div>

          <nav className="md:col-span-7 grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 text-sm" aria-label="Footer">
            <FooterCol title="Volunteer">
              <FooterLink href="/opportunities">Find a task</FooterLink>
              <FooterLink href="/how-it-works">How it works</FooterLink>
              <FooterLink href="/data/hours-calculator">{t.nav.hoursCalculator}</FooterLink>
              <FooterLink href="/how-it-works">{t.footer.snapEbt}</FooterLink>
            </FooterCol>

            <FooterCol title="Partners">
              <FooterLink href="/for-organizations">{t.nav.forOrgs}</FooterLink>
              <FooterLink href="/deliverables">{t.footer.deliverables}</FooterLink>
              <FooterLink href="/about">{t.nav.about}</FooterLink>
            </FooterCol>

            <FooterCol title="Support">
              <FooterLink href="/help">{t.footer.help}</FooterLink>
              <FooterLink href="/contact">{t.footer.contact}</FooterLink>
              <FooterLink href="/help/11-privacy">{t.footer.privacy}</FooterLink>
              <FooterLink href="/terms">{t.footer.terms}</FooterLink>
            </FooterCol>
          </nav>
        </div>

        <div className="mt-12 border-t border-paper/15 pt-6 flex flex-col gap-2 text-xs text-paper/60 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} colift. Datasets released under CC0, free for libraries, government, and the public.</span>
          <span className="text-paper/45">Unlisted pilot</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-semibold text-paper">{title}</h3>
      <ul className="flex flex-col gap-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-paper/85 hover:text-paper transition-colors">
        {children}
      </Link>
    </li>
  );
}
