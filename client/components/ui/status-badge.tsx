import { cn } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES, PROJECT_STATUSES } from "@/lib/constants";
import type { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/types";

export function TaskStatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const def = TASK_STATUSES.find((s) => s.value === status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", def?.color ?? "bg-muted-foreground")} />
      {def?.label ?? status}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  const def = TASK_PRIORITIES.find((p) => p.value === priority);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", def?.color ?? "bg-muted-foreground")} />
      {def?.label ?? priority}
    </span>
  );
}

export function ProjectStatusBadge({ status, className }: { status: ProjectStatus; className?: string }) {
  const def = PROJECT_STATUSES.find((s) => s.value === status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", def?.color ?? "bg-muted-foreground")} />
      {def?.label ?? status}
    </span>
  );
}
