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
import { useQueryClient } from "@tanstack/react-query";
import { TaskColumn } from "./task-column";
import { TaskCard } from "./task-card";
import { TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskStatus } from "@/lib/types";

interface Props {
  tasks: Task[];
}

export function TaskBoardView({ tasks }: Props) {
  const qc = useQueryClient();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

    qc.cancelQueries({ queryKey: ["tasks"] });
    qc.setQueriesData<{ items: Task[]; meta: unknown }>({ queryKey: ["tasks"] }, (old) => {
      if (!old) return old;
      return { ...old, items: old.items.map((t) => (t.id === activeTaskData.id ? { ...t, status: newStatus } : t)) };
    });

    try {
      const { apiPut } = await import("@/lib/api");
      await apiPut(`/tasks/${activeTaskData.id}`, { status: newStatus });
    } finally {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      if (activeTaskData.projectId) {
        qc.invalidateQueries({ queryKey: ["projects", activeTaskData.projectId] });
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {TASK_STATUSES.map((s) => (
          <TaskColumn key={s.value} status={s.value} tasks={columns[s.value]} />
        ))}
      </div>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
