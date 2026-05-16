"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban, ListChecks, Settings, Users, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import { APP_NAME } from "@/lib/constants";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/projects", icon: FolderKanban, label: "Projects" },
  { href: "/tasks", icon: ListChecks, label: "Tasks" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const adminNavItems = [{ href: "/settings/team", icon: Users, label: "Team", adminOnly: true }];

export function Sidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname() ?? "";
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 border-r border-border bg-card transition-all",
        collapsed ? "w-[72px]" : "w-[240px]",
      )}
    >
      <Link href="/dashboard" className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg">
          <Sparkles className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">{APP_NAME}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Workspace</span>
          </div>
        )}
      </Link>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <p className={cn("mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", collapsed && "sr-only")}>
          Workspace
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {isAdmin && (
          <>
            <p className={cn("mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", collapsed && "sr-only")}>
              Admin
            </p>
            <ul className="space-y-1">
              {adminNavItems.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <div className={cn("flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2", collapsed && "justify-center")}>
          <ShieldCheck className="h-4 w-4 text-success shrink-0" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-xs font-medium">Secure session</span>
              <span className="text-[10px] text-muted-foreground">JWT + refresh</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
