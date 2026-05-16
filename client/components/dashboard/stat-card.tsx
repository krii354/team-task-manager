"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: number; label?: string };
  color?: "indigo" | "purple" | "pink" | "amber" | "emerald" | "sky" | "rose";
  delay?: number;
}

const colorMap: Record<NonNullable<StatCardProps["color"]>, string> = {
  indigo: "from-indigo-500 to-indigo-600",
  purple: "from-purple-500 to-purple-600",
  pink: "from-pink-500 to-pink-600",
  amber: "from-amber-500 to-amber-600",
  emerald: "from-emerald-500 to-emerald-600",
  sky: "from-sky-500 to-sky-600",
  rose: "from-rose-500 to-rose-600",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  color = "indigo",
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="relative overflow-hidden rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-md", colorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            trend.value > 0 ? "text-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {trend.value > 0 ? "↑" : trend.value < 0 ? "↓" : "•"} {Math.abs(trend.value)}% {trend.label ?? "vs last period"}
        </p>
      )}
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
    </motion.div>
  );
}
