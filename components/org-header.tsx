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
    <header className="sticky top-0 z-40 border-b border-navy-deep bg-navy text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/org" className="flex items-center gap-2" aria-label="Tended for organizations">
            <Logo className="text-white" size={24} />
            <span className="hidden rounded bg-white/15 px-1.5 py-0.5 text-[11px] font-medium text-blue-100 sm:inline">for orgs</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", isActive(item.href) ? "border-b-2 border-gold text-white" : "text-blue-100 hover:text-white")}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-sm text-blue-100 lg:inline">{user.orgName}</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 md:flex">
              {user.name.split(" ")[0]}
              <ChevronDown className="size-4 text-blue-100" />
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

          <button className="rounded-md p-2 text-white hover:bg-white/10 md:hidden" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/15 bg-navy px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium [&_svg]:size-[18px]", isActive(item.href) ? "bg-white/15 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white")}>
                <item.icon /> {item.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-white/15" />
            {user.isAdmin && (
              <>
                <Link href="/org/profile" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white [&_svg]:size-[18px]"><Settings /> Organization profile</Link>
                <Link href="/org/team" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-blue-100 hover:bg-white/10 hover:text-white [&_svg]:size-[18px]"><Users2 /> Team</Link>
              </>
            )}
            <Link href="/signout" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-red-200 hover:bg-white/10 [&_svg]:size-[18px]"><LogOut /> Sign out</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
