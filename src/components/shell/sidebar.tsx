"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, Boxes, BarChart3, Users, Settings, ShieldAlert, RefreshCcw,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/reports/conversions", label: "Conversions", icon: RefreshCcw },
  { href: "/audit", label: "Audit Log", icon: ShieldAlert },
  { href: "/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
      <div className="h-14 flex items-center px-4 border-b">
        <span className="text-lg font-bold tracking-tight">N-VAT</span>
        <span className="ml-2 text-xs text-muted-foreground">ERP</span>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {nav.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              )}
            >
              <Icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 text-xs text-muted-foreground border-t">
        <div>Convert VAT → N-VAT / Damage</div>
        <div className="mt-1 font-mono text-[11px]">Ctrl + Alt + Shift + N</div>
      </div>
    </aside>
  );
}
