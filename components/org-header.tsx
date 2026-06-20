"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, X, Building2, Users2, Settings, Users, LogOut, LayoutDashboard, Inbox, ListChecks } from "lucide-react";
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

export interface OrgHeaderUser {
  name: string;
  email: string;
  orgName: string;
  isAdmin: boolean;
}

export function OrgHeader({ user }: { user: OrgHeaderUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const nav = [
    { href: "/org", label: "Dashboard", icon: LayoutDashboard },
    { href: "/org/submissions", label: "Queue", icon: Inbox },
    { href: "/org/tasks", label: "Tasks", icon: ListChecks },
  ];
  const isActive = (href: string) => (href === "/org" ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/org" className="flex items-center gap-2" aria-label="Tended for organizations">
            <Logo />
            <span className="hidden rounded bg-section px-1.5 py-0.5 text-[11px] font-medium text-meta sm:inline">for orgs</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", isActive(item.href) ? "bg-forest-subtle text-forest" : "text-body hover:bg-section")}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-meta lg:inline">{user.orgName}</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-ink hover:bg-section md:flex">
              {user.name.split(" ")[0]}
              <ChevronDown className="size-4 text-meta" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              {user.isAdmin && (
                <>
                  <DropdownMenuItem asChild><Link href="/org/profile"><Building2 /> Organization profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link href="/org/team"><Users2 /> Team</Link></DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive asChild><Link href="/signout"><LogOut /> Sign out</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button className="rounded-md p-2 text-ink hover:bg-section md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium [&_svg]:size-[18px]", isActive(item.href) ? "bg-forest-subtle text-forest" : "text-body hover:bg-section")}>
                <item.icon /> {item.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-line" />
            {user.isAdmin && (
              <>
                <Link href="/org/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section [&_svg]:size-[18px]"><Settings /> Organization profile</Link>
                <Link href="/org/team" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-body hover:bg-section [&_svg]:size-[18px]"><Users2 /> Team</Link>
              </>
            )}
            <Link href="/signout" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-brick hover:bg-brick-subtle [&_svg]:size-[18px]"><LogOut /> Sign out</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
