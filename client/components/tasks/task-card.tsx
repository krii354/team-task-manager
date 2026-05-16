"use client";

import { CSSProperties } from "react";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, MessageSquare, Paperclip } from "lucide-react";
import { PriorityBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface Props {
  task: Task;
  overlay?: boolean;
}

export function TaskCard({ task, overlay = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md cursor-grab active:cursor-grabbing",
        overlay && "shadow-xl ring-2 ring-primary/40 rotate-1",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/tasks/${task.id}`}
          className="line-clamp-2 text-sm font-medium leading-snug hover:text-primary"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {task.title}
        </Link>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className={cn("flex items-center gap-1", overdue && "text-destructive font-medium")}>
              <CalendarClock className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
          {task._count?.comments ? (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />{task._count.comments}
            </span>
          ) : null}
          {task._count?.attachments ? (
            <span className="flex items-center gap-1">
              <Paperclip className="h-3 w-3" />{task._count.attachments}
            </span>
          ) : null}
        </div>
        {task.assignedTo ? (
          <UserAvatar name={task.assignedTo.name} src={task.assignedTo.avatar} className="h-6 w-6 text-[10px]" />
        ) : (
          <div className="h-6 w-6 rounded-full border border-dashed border-border" title="Unassigned" />
        )}
      </div>
    </div>
  );
}
