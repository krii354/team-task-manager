"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar onToggleSidebar={() => setCollapsed((c) => !c)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
