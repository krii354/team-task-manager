"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  TrendingUp,
  Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { CompletionTrendChart, PriorityBreakdownChart, StatusBreakdownChart } from "@/components/dashboard/charts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { useDashboard } from "@/hooks/use-dashboard";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();
  const user = useAuthStore((s) => s.user);

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Welcome back, {user?.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <TrendingUp className="h-4 w-4 text-success" />
          <span className="font-medium">Productivity</span>
          <span className="ml-2 text-success">{data.cards.productivity}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Projects"
          value={data.cards.totalProjects}
          description={`${data.cards.activeProjects} active`}
          icon={FolderKanban}
          color="indigo"
          delay={0}
        />
        <StatCard
          title="Completed Tasks"
          value={data.cards.completedTasks}
          description={`out of ${data.cards.totalTasks}`}
          icon={CheckCircle2}
          color="emerald"
          delay={0.05}
        />
        <StatCard
          title="Pending Tasks"
          value={data.cards.pendingTasks}
          description="in active workflow"
          icon={ListTodo}
          color="sky"
          delay={0.1}
        />
        <StatCard
          title="Overdue"
          value={data.cards.overdueTasks}
          description="needs attention"
          icon={AlertTriangle}
          color="rose"
          delay={0.15}
        />
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Active Projects" value={data.cards.activeProjects} icon={Clock} color="purple" />
          <StatCard title="Completed Projects" value={data.cards.completedProjects} icon={CheckCircle2} color="emerald" />
          <StatCard title="Team Members" value={data.cards.totalMembers} icon={Users} color="pink" />
          <StatCard title="Productivity Score" value={`${data.cards.productivity}%`} icon={TrendingUp} color="amber" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <CompletionTrendChart data={data.completionTrend} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PriorityBreakdownChart data={data.priorityBreakdown} />
            <StatusBreakdownChart data={data.statusBreakdown} />
          </div>
        </div>
        <div>
          <ActivityFeed items={data.recentActivities} />
        </div>
      </div>
    </div>
  );
}
