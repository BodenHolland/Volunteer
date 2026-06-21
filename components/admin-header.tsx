"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Menu, X, Users, LogOut, LayoutDashboard, UsersRound, Building2, Inbox, MessageSquare, RotateCcw, ListChecks, ScrollText, Activity } from "lucide-react";
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

export interface AdminHeaderUser {
  name: string;
  email: string;
}

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: UsersRound },
  { href: "/admin/orgs", label: "Orgs", icon: Building2 },
  { href: "/admin/tasks", label: "Tasks", icon: ListChecks },
  { href: "/admin/submissions", label: "Submissions", icon: Inbox },
  { href: "/admin/audits", label: "Food audits", icon: Inbox },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
  { href: "/admin/system", label: "System", icon: Activity },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/admin/reset", label: "Reset", icon: RotateCcw },
];
const PRIMARY_NAV = NAV.slice(0, 5);
const MORE_NAV = NAV.slice(5);

export function AdminHeader({ user }: { user: AdminHeaderUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-navy-deep bg-navy text-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/admin" className="flex items-center gap-2 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="Tended admin">
            <Logo className="text-white" size={24} />
            <span className="hidden rounded-md border border-gold/40 bg-gold-subtle px-1.5 py-0.5 text-[11px] font-semibold text-gold-hover sm:inline">Admin</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {PRIMARY_NAV.map((item) => (
              <Link key={item.href} href={item.href} className={cn("rounded-md px-3 py-1.5 text-sm font-medium", isActive(item.href) ? "border-b-2 border-gold text-white" : "text-blue-100 hover:text-white")}>
                {item.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className={cn("flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium", MORE_NAV.some((item) => isActive(item.href)) ? "border-b-2 border-gold text-white" : "text-blue-100 hover:text-white")}>
                More <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {MORE_NAV.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href}><item.icon /> {item.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10 md:flex">
              {user.name.split(" ")[0]}
              <ChevronDown className="size-4 text-blue-100" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
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
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium [&_svg]:size-[18px]", isActive(item.href) ? "bg-white/15 text-white" : "text-blue-100 hover:bg-white/10 hover:text-white")}>
                <item.icon /> {item.label}
              </Link>
            ))}
            <div className="my-1 h-px bg-white/15" />
            <Link href="/signout" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-red-200 hover:bg-white/10 [&_svg]:size-[18px]"><LogOut /> Sign out</Link>
          </nav>
        </div>
      )}
    </header>
  );
}
