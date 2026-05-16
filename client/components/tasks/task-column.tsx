"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./task-card";
import type { Task, TaskStatus } from "@/lib/types";
import { TASK_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  status: TaskStatus;
  tasks: Task[];
  onAdd?: (status: TaskStatus) => void;
}

export function TaskColumn({ status, tasks, onAdd }: Props) {
  const def = TASK_STATUSES.find((s) => s.value === status)!;
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-muted/30 p-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", def.color)} />
          <h3 className="text-sm font-semibold">{def.label}</h3>
          <span className="rounded-md bg-background px-1.5 py-0.5 text-xs text-muted-foreground">{tasks.length}</span>
        </div>
        {onAdd && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onAdd(status)} aria-label="Add task">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-1 transition-colors min-h-[200px]",
          isOver && "bg-primary/5 ring-1 ring-inset ring-primary/30",
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="grid h-20 place-items-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}
