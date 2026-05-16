"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/auth.store";
import { Sparkles } from "lucide-react";

export function AuthGuard({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (adminOnly && user.role !== "ADMIN") {
      router.replace("/unauthorized");
    }
  }, [hydrated, user, adminOnly, router]);

  if (!hydrated || !user || (adminOnly && user.role !== "ADMIN")) {
    return (
      <div className="grid h-screen place-items-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Sparkles className="h-5 w-5 animate-pulse text-primary" />
          <span className="text-sm">Loading workspace…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
