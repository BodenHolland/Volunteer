"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, X, User as UserIcon, Settings, Users, LogOut, LayoutDashboard, ListChecks, FolderKanban } from "lucide-react";
import { Logo } from "@/components/logo";
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

const RECIPIENT_NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/tasks", label: "Tasks", icon: ListChecks },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
];

export function AppHeader({ user, nav = RECIPIENT_NAV, home = "/app" }: { user: HeaderUser; nav?: typeof RECIPIENT_NAV; home?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === home ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href={home} aria-label="Tended home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium",
                  isActive(item.href) ? "bg-forest-subtle text-forest" : "text-body hover:bg-section"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink hover:bg-section md:flex">
              {user.name.split(" ")[0]}
              <ChevronDown className="size-4 text-meta" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              {user.isSnap && (
                <DropdownMenuItem asChild>
                  <Link href="/app/profile"><UserIcon /> CalFresh profile</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/app/settings"><Settings /> Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive asChild>
                <Link href="/signout"><LogOut /> Sign out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            className="rounded-md p-2 text-ink hover:bg-section md:hidden"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium [&_svg]:size-[18px]",
                  isActive(item.href) ? "bg-forest-subtle text-forest" : "text-body hover:bg-section"
                )}
              >
                <item.icon /> {item.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-line" />
            {user.isSnap && (
              <Link href="/app/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section [&_svg]:size-[18px]"><UserIcon /> CalFresh profile</Link>
            )}
            <Link href="/app/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section [&_svg]:size-[18px]"><Settings /> Settings</Link>
            <Link href="/signout" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-brick hover:bg-brick-subtle [&_svg]:size-[18px]"><LogOut /> Sign out</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
