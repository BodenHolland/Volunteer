"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown, BookOpen, Building2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";

interface NavStrings {
  howItWorks: string;
  about: string;
  forOrgs: string;
  signIn: string;
  seeTasks: string;
}
const EN: NavStrings = {
  howItWorks: "How it works",
  about: "About",
  forOrgs: "For organizations",
  signIn: "Sign in",
  seeTasks: "See tasks",
};

export function SiteHeader({ locale = "en", t = EN }: { locale?: "en" | "es"; t?: NavStrings }) {
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Tended home"><Logo size={22} className="text-lg" /></Link>
          <nav className="hidden items-center gap-1 md:flex">
            <div className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
              <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section">
                {t.howItWorks} <ChevronDown className="size-4 text-meta" />
              </button>
              {mega && (
                <div className="absolute left-0 top-full w-[520px] rounded-lg border border-line bg-white p-4 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="overline mb-2">Explore</p>
                      <Link href="/how-it-works#civic-work" className="block rounded-md px-2 py-1.5 text-sm font-medium text-ink hover:bg-section">Civic work</Link>
                      <Link href="/how-it-works#calfresh" className="block rounded-md px-2 py-1.5 text-sm font-medium text-ink hover:bg-section">CalFresh certification</Link>
                      <Link href="/how-it-works#identity" className="block rounded-md px-2 py-1.5 text-sm font-medium text-ink hover:bg-section">Privacy &amp; identity</Link>
                    </div>
                    <div className="space-y-2">
                      <Link href="/about" className="flex gap-2.5 rounded-md p-2 hover:bg-section">
                        <BookOpen className="mt-0.5 size-[18px] text-forest" />
                        <span><span className="block text-sm font-semibold text-ink">About the pilot</span><span className="block text-xs text-body">Why we built Tended.</span></span>
                      </Link>
                      <Link href="/for-organizations" className="flex gap-2.5 rounded-md p-2 hover:bg-section">
                        <Building2 className="mt-0.5 size-[18px] text-forest" />
                        <span><span className="block text-sm font-semibold text-ink">For organizations</span><span className="block text-xs text-body">Host tasks and review work.</span></span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Link href="/about" className="rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section">{t.about}</Link>
            <Link href="/for-organizations" className="rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section">{t.forOrgs}</Link>
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LocaleSwitcher locale={locale} />
          <Button asChild variant="secondary"><Link href="/login">{t.signIn}</Link></Button>
          <Button asChild><Link href="/app/tasks">{t.seeTasks}</Link></Button>
        </div>

        <button className="rounded-md p-2 text-ink hover:bg-section md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            <Link href="/how-it-works" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section">{t.howItWorks}</Link>
            <Link href="/about" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section">{t.about}</Link>
            <Link href="/for-organizations" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section">{t.forOrgs}</Link>
            <div className="my-1 h-px bg-line" />
            <div className="px-3 py-1"><LocaleSwitcher locale={locale} /></div>
            <Button asChild variant="secondary" className="w-full"><Link href="/login">{t.signIn}</Link></Button>
            <Button asChild className="mt-2 w-full"><Link href="/app/tasks">{t.seeTasks}</Link></Button>
          </nav>
        </div>
      )}
    </header>
  );
}
