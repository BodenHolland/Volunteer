"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  Building2,
  ChevronDown,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  UserRound,
  Users2,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/locale-switcher";
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
  seeTasks: string;
}

const EN: PublicNavStrings = {
  howItWorks: "How it works",
  about: "About",
  forOrgs: "For organizations",
  signIn: "Sign in",
  seeTasks: "See tasks",
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
  const [mega, setMega] = useState(false);
  const workspaceLabel = viewer ? WorkspaceLabel(viewer) : null;

  return (
    <header className="sticky top-0 z-40 border-b border-navy-deep bg-navy text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href={viewer?.home ?? "/"} aria-label="Tended home" className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Logo className="text-white" size={24} />
          </Link>
          {!viewer && <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            <div className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
              <button className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 hover:text-white" aria-expanded={mega}>
                {t.howItWorks} <ChevronDown className="size-4" />
              </button>
              {mega && (
                <div className="absolute left-0 top-full mt-2 w-[520px] rounded-lg border border-line bg-white p-4 text-ink shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="overline mb-2">Explore</p>
                      <Link href="/how-it-works#civic-work" className="block rounded-md px-2 py-1.5 text-sm font-medium hover:bg-section">Online volunteering</Link>
                      <Link href="/how-it-works#calfresh" className="block rounded-md px-2 py-1.5 text-sm font-medium hover:bg-section">SNAP/EBT certification</Link>
                      <Link href="/how-it-works#identity" className="block rounded-md px-2 py-1.5 text-sm font-medium hover:bg-section">Privacy &amp; identity</Link>
                    </div>
                    <div className="space-y-2">
                      <Link href="/about" className="flex gap-2.5 rounded-md p-2 hover:bg-section">
                        <BookOpen className="mt-0.5 size-[18px] text-teal" />
                        <span><span className="block text-sm font-semibold">About Tended</span><span className="block text-xs text-body">Why we built Tended.</span></span>
                      </Link>
                      <Link href="/for-organizations" className="flex gap-2.5 rounded-md p-2 hover:bg-section">
                        <Building2 className="mt-0.5 size-[18px] text-teal" />
                        <span><span className="block text-sm font-semibold">For organizations</span><span className="block text-xs text-body">Host tasks and review work.</span></span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Link href="/about" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 hover:text-white">{t.about}</Link>
            <Link href="/for-organizations" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-100 hover:text-white">{t.forOrgs}</Link>
          </nav>}
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} className="hidden text-white md:inline-flex" />
          {viewer ? (
            <>
              <Button asChild variant="secondary" size="sm" className="hidden md:inline-flex">
                <Link href={viewer.home}><LayoutDashboard /> {workspaceLabel}</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger className="hidden items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 md:flex">
                  {viewer.name.split(" ")[0]} <ChevronDown className="size-4 text-blue-100" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>{viewer.email}</DropdownMenuLabel>
                  {viewer.role === "recipient" && viewer.isSnap && <DropdownMenuItem asChild><Link href="/app/profile"><UserRound /> SNAP profile</Link></DropdownMenuItem>}
                  {viewer.role === "recipient" && <DropdownMenuItem asChild><Link href="/app/settings"><Settings /> Settings</Link></DropdownMenuItem>}
                  {viewer.role === "org_member" && <DropdownMenuItem asChild><Link href="/org/profile"><Settings /> Organization profile</Link></DropdownMenuItem>}
                  {viewer.role === "org_member" && viewer.isOrgAdmin && <DropdownMenuItem asChild><Link href="/org/team"><Users2 /> Team</Link></DropdownMenuItem>}
                  {viewer.role === "admin" && <DropdownMenuItem asChild><Link href="/admin"><Settings /> Admin workspace</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive asChild><Link href="/signout"><LogOut /> Sign out</Link></DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button asChild variant="secondary" size="sm" className="hidden md:inline-flex"><Link href="/login">{t.signIn}</Link></Button>
              <Button asChild size="sm" className="hidden md:inline-flex"><Link href="/app/tasks">{t.seeTasks}</Link></Button>
            </>
          )}
          <button className="rounded-md p-2 text-white hover:bg-white/10 md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/15 bg-navy px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {!viewer && <>
              <Link href="/how-it-works" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">{t.howItWorks}</Link>
              <Link href="/about" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">{t.about}</Link>
              <Link href="/for-organizations" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">{t.forOrgs}</Link>
              <div className="my-1 h-px bg-white/15" />
            </>}
            {viewer ? (
              <>
                <Link href={viewer.home} onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white hover:bg-white/10"><LayoutDashboard className="size-[18px]" /> {workspaceLabel}</Link>
                <AccountLinks viewer={viewer} onNavigate={() => setOpen(false)} />
                <div className="my-1 h-px bg-white/15" />
                <Link href="/how-it-works" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">{t.howItWorks}</Link>
                <Link href="/about" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">{t.about}</Link>
                <Link href="/for-organizations" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white">{t.forOrgs}</Link>
                <Link href="/signout" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-red-200 hover:bg-white/10"><LogOut className="size-[18px]" /> Sign out</Link>
              </>
            ) : (
              <>
                <Button asChild variant="secondary" className="w-full"><Link href="/login">{t.signIn}</Link></Button>
                <Button asChild className="mt-2 w-full"><Link href="/app/tasks">{t.seeTasks}</Link></Button>
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
