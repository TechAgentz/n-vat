"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Menu, Home, Clock, Pin, ChevronDown, ChevronUp,
  LayoutDashboard, Activity, FileSearch, MapPin,
  UserSquare2, Users, ChevronsUpDown,
  FileText, Boxes, BarChart3, ShieldAlert, Settings2, RefreshCcw,
} from "lucide-react";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; pinColor?: string };

const dashboards: Item[] = [
  { href: "/dashboard",           label: "Dashboards",   icon: LayoutDashboard },
  { href: "/audit",               label: "Activities",   icon: Activity },
  { href: "/reports/conversions", label: "Berth Search", icon: FileSearch },
];

const maps: Item[] = [
  { href: "/invoices?filter=marasi",   label: "Marasi Bay",   icon: MapPin, pinColor: "text-orange-500" },
  { href: "/invoices?filter=jaddaf",   label: "Jaddaf",       icon: MapPin, pinColor: "text-orange-500" },
  { href: "/invoices?filter=marsa",    label: "Marsa Al Arab",icon: MapPin, pinColor: "text-orange-500" },
  { href: "/invoices?filter=alseef",   label: "Alseef",       icon: MapPin, pinColor: "text-orange-500" },
  { href: "/invoices?filter=portlamer",label: "Port La Mer",  icon: MapPin, pinColor: "text-orange-500" },
];

const customers: Item[] = [
  { href: "/users",     label: "Accounts", icon: UserSquare2 },
  { href: "/reports",   label: "Contacts", icon: Users },
];

const business: Item[] = [
  { href: "/invoices",            label: "Invoices",       icon: FileText },
  { href: "/stock",               label: "Stock",          icon: Boxes },
  { href: "/reports",             label: "Reports",        icon: BarChart3 },
  { href: "/reports/conversions", label: "Conversions",    icon: RefreshCcw },
  { href: "/audit",               label: "Audit Log",      icon: ShieldAlert },
  { href: "/settings",            label: "Settings",       icon: Settings2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [recentOpen, setRecentOpen] = useState(false);
  const [pinnedOpen, setPinnedOpen] = useState(false);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:top-12 md:bottom-0 md:inset-x-0 md:left-0 md:right-auto border-r bg-white text-neutral-800">
      <div className="h-11 flex items-center px-2 border-b">
        <button className="h-8 w-8 grid place-items-center hover:bg-neutral-100 rounded" aria-label="Toggle nav">
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 text-sm">
        <NavLink href="/dashboard" label="Home" icon={Home} active={pathname === "/dashboard"} />

        <Collapsible open={recentOpen} onToggle={() => setRecentOpen((v) => !v)} label="Recent" icon={Clock} />
        <Collapsible open={pinnedOpen} onToggle={() => setPinnedOpen((v) => !v)} label="Pinned" icon={Pin} />

        <SectionHeader>Dashboards</SectionHeader>
        {dashboards.map((n) => (
          <NavLink key={n.href} {...n} active={isActive(pathname, n.href)} />
        ))}

        <SectionHeader>Maps</SectionHeader>
        {maps.map((n) => (
          <NavLink key={n.href} {...n} active={isActive(pathname, n.href)} />
        ))}

        <SectionHeader>Customers</SectionHeader>
        {customers.map((n) => (
          <NavLink key={n.href} {...n} active={isActive(pathname, n.href)} />
        ))}

        <SectionHeader>Business</SectionHeader>
        {business.map((n) => (
          <NavLink key={n.href} {...n} active={isActive(pathname, n.href)} />
        ))}
      </nav>

      <div className="border-t p-2">
        <button className="w-full flex items-center gap-2 h-10 px-3 rounded bg-neutral-100 hover:bg-neutral-200 text-sm font-medium">
          <span className="h-6 w-6 rounded-full bg-emerald-600 text-white grid place-items-center text-xs">O</span>
          <span className="flex-1 text-left">Operations</span>
          <ChevronsUpDown className="h-4 w-4 text-neutral-500" />
        </button>
      </div>
    </aside>
  );
}

function isActive(pathname: string, href: string) {
  const base = href.split("?")[0];
  return pathname === base || (base !== "/" && pathname.startsWith(base + "/"));
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 mb-1 px-4 text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
      {children}
    </div>
  );
}

function NavLink({
  href, label, icon: Icon, active, pinColor,
}: Item & { active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 h-9 pl-4 pr-3 mx-1 rounded",
        active ? "bg-sky-50 text-sky-700 font-medium" : "hover:bg-neutral-100"
      )}
    >
      <Icon className={cn("h-4 w-4", pinColor ?? (active ? "text-sky-700" : "text-neutral-600"))} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function Collapsible({
  open, onToggle, label, icon: Icon,
}: { open: boolean; onToggle: () => void; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 h-9 pl-4 pr-3 mx-1 rounded hover:bg-neutral-100"
      >
        <Icon className="h-4 w-4 text-neutral-600" />
        <span className="flex-1 text-left">{label}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div className="px-4 py-1 text-xs text-neutral-500">Nothing yet.</div>
      )}
    </>
  );
}
