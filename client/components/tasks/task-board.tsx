"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/use-tasks";
import { TaskColumn } from "./task-column";
import { TaskCard } from "./task-card";
import { TaskFormDialog } from "./task-form-dialog";
import { TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskStatus } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  projectId?: string;
}

export function TaskBoard({ projectId }: Props) {
  const qc = useQueryClient();
  const { data, isLoading } = useTasks({ projectId, pageSize: 200 });
  const tasks = data?.items ?? [];

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [open, setOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("TODO");

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columns: Record<TaskStatus, Task[]> = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], REVIEW: [], COMPLETED: [] };
    for (const t of tasks) map[t.status].push(t);
    Object.values(map).forEach((list) => list.sort((a, b) => a.order - b.order));
    return map;
  }, [tasks]);

  function onDragStart(e: DragStartEvent) {
    const task = (e.active.data.current as { task?: Task })?.task ?? null;
    setActiveTask(task);
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = e;
    if (!over) return;

    const activeTaskData = (active.data.current as { task?: Task })?.task;
    if (!activeTaskData) return;

    const overData = over.data.current as { type?: string; task?: Task } | undefined;
    let newStatus: TaskStatus = activeTaskData.status;
    if (overData?.type === "task" && overData.task) newStatus = overData.task.status;
    else newStatus = over.id as TaskStatus;

    if (newStatus === activeTaskData.status) return;

    const queryKeys = [["tasks"], ["dashboard"], projectId ? ["projects", projectId] : ["projects"]];
    queryKeys.forEach((k) => qc.cancelQueries({ queryKey: k }));

    // Optimistic UI update
    qc.setQueriesData<{ items: Task[]; meta: unknown }>({ queryKey: ["tasks"] }, (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((t) => (t.id === activeTaskData.id ? { ...t, status: newStatus } : t)),
      };
    });

    try {
      const { apiPut } = await import("@/lib/api");
      await apiPut(`/tasks/${activeTaskData.id}`, { status: newStatus });
    } finally {
      queryKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-96 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {TASK_STATUSES.map((s) => (
            <TaskColumn
              key={s.value}
              status={s.value}
              tasks={columns[s.value]}
              onAdd={projectId ? (status) => { setDefaultStatus(status); setOpen(true); } : undefined}
            />
          ))}
        </div>
        <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
      </DndContext>

      {projectId && (
        <>
          <div className="mt-4 flex justify-end">
            <Button variant="gradient" size="sm" onClick={() => { setDefaultStatus("TODO"); setOpen(true); }}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          </div>
          <TaskFormDialog open={open} onOpenChange={setOpen} defaultProjectId={projectId} defaultStatus={defaultStatus} />
        </>
      )}
    </>
  );
}
