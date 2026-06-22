"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, X, User as UserIcon, Settings, LayoutDashboard, ListChecks, CircleHelp } from "lucide-react";
import { Logo } from "@/components/logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SignOutMenuItem, SignOutButton } from "@/components/sign-out";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export interface HeaderUser {
  name: string;
  email: string;
  intent: string;
  isSnap: boolean;
}

interface NavLabels {
  dashboard: string;
  tasks: string;
  projects: string;
  calfreshProfile: string;
  settings: string;
  signOut: string;
  help: string;
}

const EN_LABELS: NavLabels = {
  dashboard: "Dashboard",
  tasks: "Tasks",
  projects: "My work",
  calfreshProfile: "SNAP profile",
  settings: "Settings",
  signOut: "Sign out",
  help: "Help center",
};

export function AppHeader({
  user,
  home = "/app",
  locale = "en",
  labels = EN_LABELS,
}: {
  user: HeaderUser;
  home?: string;
  locale?: "en" | "es";
  labels?: NavLabels;
}) {
  // "My work" (/app/projects) is intentionally NOT a top-nav tab: the dashboard
  // already surfaces active work, and its sidebar keeps a "My work" shortcut to
  // the full history. Keeping it as a peer tab next to Dashboard was redundant.
  const nav = [
    { href: "/app", label: labels.dashboard, icon: LayoutDashboard },
    { href: "/app/tasks", label: labels.tasks, icon: ListChecks },
  ];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === home ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-navy-deep bg-navy text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href={home} aria-label="Tended home" className="rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
            <Logo className="text-white" size={24} />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  isActive(item.href) ? "border-b-2 border-gold text-white" : "text-blue-100 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} className="hidden text-white md:inline-flex" />
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 md:flex">
              {user.name.split(" ")[0]}
              <ChevronDown className="size-4 text-blue-100" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              {user.isSnap && (
                <DropdownMenuItem asChild>
                  <Link href="/app/profile"><UserIcon /> {labels.calfreshProfile}</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/app/settings"><Settings /> {labels.settings}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/help"><CircleHelp /> {labels.help}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <SignOutMenuItem label={labels.signOut} />
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="rounded-md p-2 text-white hover:bg-white/10 md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/15 bg-navy px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium [&_svg]:size-[18px]",
                  isActive(item.href) ? "bg-white/15 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon /> {item.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-white/15" />
            {user.isSnap && (
              <Link href="/app/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white [&_svg]:size-[18px]"><UserIcon /> {labels.calfreshProfile}</Link>
            )}
            <Link href="/app/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white [&_svg]:size-[18px]"><Settings /> {labels.settings}</Link>
            <Link href="/help" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white [&_svg]:size-[18px]"><CircleHelp /> {labels.help}</Link>
            <SignOutButton className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium text-red-200 hover:bg-white/10 [&_svg]:size-[18px]" label={labels.signOut} />
            <div className="my-1 h-px bg-white/15" />
            <div className="px-3 py-1"><LocaleSwitcher locale={locale} /></div>
          </nav>
        </div>
      )}
    </header>
  );
}
