import type { ProjectStatus, TaskPriority, TaskStatus } from "./types";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Team Task Manager";

// Defaults to a relative `/api` URL so the unified single-service deploy works
// out of the box. Local dev should set NEXT_PUBLIC_API_URL=http://localhost:4000/api
// in client/.env (already done in client/.env.example).
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export const ACCESS_TOKEN_KEY = "ttm_access_token";
export const REFRESH_TOKEN_KEY = "ttm_refresh_token";

export const TASK_STATUSES: { value: TaskStatus; label: string; color: string }[] = [
  { value: "TODO", label: "To Do", color: "bg-slate-500" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-info" },
  { value: "REVIEW", label: "Review", color: "bg-warning" },
  { value: "COMPLETED", label: "Completed", color: "bg-success" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "bg-slate-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-info" },
  { value: "HIGH", label: "High", color: "bg-warning" },
  { value: "CRITICAL", label: "Critical", color: "bg-destructive" },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: "PLANNING", label: "Planning", color: "bg-slate-500" },
  { value: "ACTIVE", label: "Active", color: "bg-success" },
  { value: "ON_HOLD", label: "On Hold", color: "bg-warning" },
  { value: "COMPLETED", label: "Completed", color: "bg-info" },
  { value: "ARCHIVED", label: "Archived", color: "bg-muted-foreground" },
];

export const PROJECT_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
];
