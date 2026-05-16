"use client";

import Link from "next/link";
import { LogOut, Menu, Search, User, Settings as SettingsIcon, Bell } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./theme-toggle";
import { useAuthStore } from "@/store/auth.store";
import { useLogout } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/tasks?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="rounded-full"
        aria-label="Toggle sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <form className="hidden md:flex flex-1 max-w-md" onSubmit={onSearch}>
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks, projects..."
            className="pl-9 bg-muted/40 border-transparent focus-visible:bg-background"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="rounded-full relative" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full px-1 transition-colors hover:bg-accent"
            >
              <UserAvatar name={user?.name ?? "User"} src={user?.avatar} className="h-8 w-8" />
              <div className="hidden md:flex flex-col items-start pr-2">
                <span className="text-xs font-medium leading-tight">{user?.name}</span>
                <Badge variant={user?.role === "ADMIN" ? "default" : "secondary"} className="h-4 px-1.5 text-[9px]">
                  {user?.role}
                </Badge>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings"><User className="mr-1 h-4 w-4" /> Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings"><SettingsIcon className="mr-1 h-4 w-4" /> Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout.mutate()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-1 h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
