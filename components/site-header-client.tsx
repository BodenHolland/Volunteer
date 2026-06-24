"use client";

import Link from "next/link";
import { useState } from "react";
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
import { LocaleSwitcher } from "@/components/locale-switcher";
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
  signIn: "Sign in",
  signUp: "Sign up",
  opportunities: "Volunteer Opportunities",
  help: "Help center",
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

function AccountLinks({ viewer, onNavigate }: { viewer: Viewer; onNavigate?: () => void }) {
  if (viewer.role === "recipient") {
    return (
      <>
        {viewer.isSnap && (
          <Link href="/app/profile" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">
            <UserRound className="size-[18px]" /> SNAP profile
          </Link>
        )}
        <Link href="/app/settings" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">
          <Settings className="size-[18px]" /> Settings
        </Link>
      </>
    );
  }

  if (viewer.role === "org_member") {
    return (
      <>
        <Link href="/org/profile" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">
          <Settings className="size-[18px]" /> Organization profile
        </Link>
        {viewer.isOrgAdmin && (
          <Link href="/org/team" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">
            <Users2 className="size-[18px]" /> Team
          </Link>
        )}
      </>
    );
  }

  return (
    <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">
      <Settings className="size-[18px]" /> Admin workspace
    </Link>
  );
}

export function SiteHeaderClient({
  locale = "en",
  t = EN,
  viewer,
}: {
  locale?: "en" | "es";
  t?: PublicNavStrings;
  viewer: Viewer | null;
}) {
  const [open, setOpen] = useState(false);
  const workspaceLabel = viewer ? WorkspaceLabel(viewer) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-navy-deep bg-navy text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href={viewer?.home ?? "/"} aria-label="Tended home" className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Logo className="text-white" size={24} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            <Link href="/how-it-works" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 hover:text-white">{t.howItWorks}</Link>
            <Link href="/opportunities" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 hover:text-white">{t.opportunities}</Link>
            {!viewer && <Link href="/help" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 hover:text-white">{t.help}</Link>}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {viewer ? (
            <>
              <Link href={viewer.home} className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 hover:text-white md:flex">
                <LayoutDashboard className="size-4" /> {workspaceLabel}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger aria-label={`Account: ${viewer.name}`} className="hidden items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 md:flex">
                  You <ChevronDown className="size-4 text-blue-100" />
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
              <Button asChild size="sm" variant="ghost" className="hidden text-white hover:bg-white/10 hover:text-white md:inline-flex"><Link href="/login">{t.signIn}</Link></Button>
              <Button asChild size="sm" className="hidden md:inline-flex"><Link href="/signup">{t.signUp}</Link></Button>
            </>
          )}
          <LocaleSwitcher locale={locale} className="hidden text-white md:inline-flex" />
          <button className="rounded-md p-2 text-white hover:bg-white/10 md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/15 bg-navy px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {viewer && (
              <>
                <Link href={viewer.home} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-white/10"><LayoutDashboard className="size-[18px]" /> {workspaceLabel}</Link>
                <div className="my-1 h-px bg-white/15" />
              </>
            )}
            <Link href="/how-it-works" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">{t.howItWorks}</Link>
            <Link href="/opportunities" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">{t.opportunities}</Link>
            {!viewer && <Link href="/help" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">{t.help}</Link>}
            <div className="my-1 h-px bg-white/15" />
            {viewer ? (
              <>
                <AccountLinks viewer={viewer} onNavigate={() => setOpen(false)} />
                <SignOutButton className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-red-200 hover:bg-white/10 [&_svg]:size-[18px]" />
              </>
            ) : (
              <>
                <Button asChild className="w-full"><Link href="/signup">{t.signUp}</Link></Button>
                <Button asChild variant="secondary" className="w-full"><Link href="/login">{t.signIn}</Link></Button>
              </>
            )}
            <div className="my-1 h-px bg-white/15" />
            <div className="px-3 py-1"><LocaleSwitcher locale={locale} /></div>
          </nav>
        </div>
      )}
    </header>
  );
}
