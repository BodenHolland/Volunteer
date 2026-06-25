"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  Menu,
  Settings,
  UserRound,
  Users2,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { SignOutMenuItem, SignOutButton } from "@/components/sign-out";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface PublicNavStrings {
  howItWorks: string;
  about: string;
  forOrgs: string;
  signIn: string;
  signUp: string;
  opportunities: string;
  help: string;
}

const EN: PublicNavStrings = {
  howItWorks: "How it works",
  about: "About",
  forOrgs: "For organizations",
  signIn: "Log in",
  signUp: "Get started",
  opportunities: "Find a task",
  help: "Help",
};

type Viewer = {
  name: string;
  email: string;
  role: "recipient" | "org_member" | "admin";
  isSnap: boolean;
  home: string;
  isOrgAdmin: boolean;
};

function WorkspaceLabel(viewer: Viewer) {
  if (viewer.role === "org_member") return "Organization workspace";
  if (viewer.role === "admin") return "Admin workspace";
  return "Dashboard";
}

const navLinkBase =
  "rounded-md px-3 py-2 text-[14px] font-medium text-ink/80 hover:text-ink transition-colors";

const mobileLinkBase =
  "block rounded-md px-3 py-3 text-base font-medium text-ink hover:bg-paper-deep transition-colors";

function AccountLinks({ viewer, onNavigate }: { viewer: Viewer; onNavigate?: () => void }) {
  if (viewer.role === "recipient") {
    return (
      <>
        {viewer.isSnap && (
          <Link href="/app/profile" onClick={onNavigate} className={mobileLinkBase}>
            <span className="inline-flex items-center gap-2.5"><UserRound className="size-[18px]" /> SNAP profile</span>
          </Link>
        )}
        <Link href="/app/settings" onClick={onNavigate} className={mobileLinkBase}>
          <span className="inline-flex items-center gap-2.5"><Settings className="size-[18px]" /> Settings</span>
        </Link>
      </>
    );
  }

  if (viewer.role === "org_member") {
    return (
      <>
        <Link href="/org/profile" onClick={onNavigate} className={mobileLinkBase}>
          <span className="inline-flex items-center gap-2.5"><Settings className="size-[18px]" /> Organization profile</span>
        </Link>
        {viewer.isOrgAdmin && (
          <Link href="/org/team" onClick={onNavigate} className={mobileLinkBase}>
            <span className="inline-flex items-center gap-2.5"><Users2 className="size-[18px]" /> Team</span>
          </Link>
        )}
      </>
    );
  }

  return (
    <Link href="/admin" onClick={onNavigate} className={mobileLinkBase}>
      <span className="inline-flex items-center gap-2.5"><Settings className="size-[18px]" /> Admin workspace</span>
    </Link>
  );
}

export function SiteHeaderClient({
  locale = "en",
  t = EN,
  viewer,
}: {
  locale?: string;
  t?: PublicNavStrings;
  viewer: Viewer | null;
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const workspaceLabel = viewer ? WorkspaceLabel(viewer) : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <header
      className={
        "sticky top-0 z-40 border-b border-civic-line bg-white transition-shadow duration-200 " +
        (scrolled ? "shadow-[0_4px_16px_-4px_rgba(19,35,30,0.08)]" : "")
      }
    >
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="colift home" className="rounded-md focus-visible:outline-none">
            <Logo size={40} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            <Link href="/opportunities" className={navLinkBase}>{t.opportunities}</Link>
            <Link href="/how-it-works" className={navLinkBase}>{t.howItWorks}</Link>
            <Link href="/for-organizations" className={navLinkBase}>{t.forOrgs}</Link>
            <Link href="/about" className={navLinkBase}>{t.about}</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {viewer ? (
            <>
              <Link
                href={viewer.home}
                className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-[14px] font-medium text-ink/80 hover:text-ink md:flex"
              >
                <LayoutDashboard className="size-4" /> {workspaceLabel}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Account: ${viewer.name}`}
                  className="hidden items-center gap-1.5 rounded-full border border-civic-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper-deep md:flex"
                >
                  {viewer.name.split(" ")[0]} <ChevronDown className="size-4 text-slate" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>{viewer.email}</DropdownMenuLabel>
                  {viewer.role === "recipient" && viewer.isSnap && <DropdownMenuItem asChild><Link href="/app/profile"><UserRound /> SNAP profile</Link></DropdownMenuItem>}
                  {viewer.role === "recipient" && <DropdownMenuItem asChild><Link href="/app/settings"><Settings /> Settings</Link></DropdownMenuItem>}
                  {viewer.role === "org_member" && <DropdownMenuItem asChild><Link href="/org/profile"><Settings /> Organization profile</Link></DropdownMenuItem>}
                  {viewer.role === "org_member" && viewer.isOrgAdmin && <DropdownMenuItem asChild><Link href="/org/team"><Users2 /> Team</Link></DropdownMenuItem>}
                  {viewer.role === "admin" && <DropdownMenuItem asChild><Link href="/admin"><Settings /> Admin workspace</Link></DropdownMenuItem>}
                  <DropdownMenuItem asChild><Link href="/help"><CircleHelp /> {t.help}</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <SignOutMenuItem />
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-md px-3 py-2 text-[14px] font-medium text-ink/80 hover:text-ink md:inline-block"
              >
                {t.signIn}
              </Link>
              <Button asChild size="sm" className="hidden md:inline-flex">
                <Link href="/get-started">{t.signUp}</Link>
              </Button>
            </>
          )}
          {/* LocaleSwitcher removed: site is English-only.
              Multi-language work is archived on the `archive/i18n-full` branch. */}
          <button
            className="rounded-md p-2 text-ink hover:bg-paper-deep md:hidden"
            aria-label={open ? "Close menu" : "Menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-x-0 top-[72px] bottom-0 z-50 overflow-y-auto border-t border-civic-line bg-white px-5 pb-8 pt-3 md:hidden"
          aria-label="Mobile navigation"
        >
          <nav className="flex flex-col gap-1">
            {viewer && (
              <>
                <Link href={viewer.home} onClick={() => setOpen(false)} className={mobileLinkBase}>
                  <span className="inline-flex items-center gap-2.5"><LayoutDashboard className="size-[18px]" /> {workspaceLabel}</span>
                </Link>
                <div className="my-1 h-px bg-civic-line" />
              </>
            )}
            <Link href="/opportunities" onClick={() => setOpen(false)} className={mobileLinkBase}>{t.opportunities}</Link>
            <Link href="/how-it-works" onClick={() => setOpen(false)} className={mobileLinkBase}>{t.howItWorks}</Link>
            <Link href="/for-organizations" onClick={() => setOpen(false)} className={mobileLinkBase}>{t.forOrgs}</Link>
            <Link href="/about" onClick={() => setOpen(false)} className={mobileLinkBase}>{t.about}</Link>
            <Link href="/help" onClick={() => setOpen(false)} className={mobileLinkBase}>{t.help}</Link>
            {viewer ? (
              <>
                <div className="my-1 h-px bg-civic-line" />
                <AccountLinks viewer={viewer} onNavigate={() => setOpen(false)} />
                <SignOutButton className="mt-1 flex w-full items-center gap-2.5 rounded-md px-3 py-3 text-left text-base font-medium text-community-red hover:bg-community-red-soft [&_svg]:size-[18px]" />
              </>
            ) : null}
            {/* LocaleSwitcher removed: site is English-only.
                Restore from `archive/i18n-full` branch when re-adding languages. */}
            {!viewer && (
              <div className="mt-4 flex flex-col gap-2 px-1">
                <Button asChild size="lg" className="w-full"><Link href="/get-started" onClick={() => setOpen(false)}>{t.signUp}</Link></Button>
                <Button asChild size="lg" variant="secondary" className="w-full"><Link href="/login" onClick={() => setOpen(false)}>{t.signIn}</Link></Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
