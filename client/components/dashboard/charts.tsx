"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CompletionTrendProps {
  data: { month: string; completed: number }[];
}

export function CompletionTrendChart({ data }: CompletionTrendProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Completion Trend</CardTitle>
        <CardDescription>Completed tasks over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#completedGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface PriorityBreakdownProps {
  data: { priority: string; count: number }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#64748b",
  MEDIUM: "#0ea5e9",
  HIGH: "#f59e0b",
  CRITICAL: "#ef4444",
};

export function PriorityBreakdownChart({ data }: PriorityBreakdownProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Priority</CardTitle>
        <CardDescription>Workload distribution across priorities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -20, right: 8, top: 10, bottom: 0 }}>
              <XAxis dataKey="priority" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                cursor={{ fill: "hsl(var(--muted))" }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] ?? "#6366f1"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatusBreakdownProps {
  data: { todo: number; inProgress: number; review: number; completed: number };
}

export function StatusBreakdownChart({ data }: StatusBreakdownProps) {
  const radarData = [
    { stage: "To Do", value: data.todo },
    { stage: "In Progress", value: data.inProgress },
    { stage: "Review", value: data.review },
    { stage: "Completed", value: data.completed },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline Health</CardTitle>
        <CardDescription>Distribution across workflow stages</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius={90}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="stage" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Radar
                name="Tasks"
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.35}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
