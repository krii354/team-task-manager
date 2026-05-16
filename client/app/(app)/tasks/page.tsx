"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListChecks, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TaskBoardView } from "@/components/tasks/task-board-view";
import { TaskTable } from "@/components/tasks/task-table";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import type { TaskPriority, TaskStatus } from "@/lib/types";

export default function TasksPage() {
  const params = useSearchParams();
  const initialSearch = params.get("search") ?? "";

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<TaskStatus | "ALL">("ALL");
  const [priority, setPriority] = useState<TaskPriority | "ALL">("ALL");
  const [projectId, setProjectId] = useState<string | "ALL">("ALL");
  const [overdue, setOverdue] = useState(false);
  const [open, setOpen] = useState(false);

  const { data: projectsResp } = useProjects({ pageSize: 100 });
  const projects = projectsResp?.items ?? [];

  const query = useMemo(
    () => ({
      search: search || undefined,
      status: status === "ALL" ? undefined : status,
      priority: priority === "ALL" ? undefined : priority,
      projectId: projectId === "ALL" ? undefined : projectId,
      overdue: overdue || undefined,
      pageSize: 200,
    }),
    [search, status, priority, projectId, overdue],
  );

  const { data, isLoading } = useTasks(query);
  const tasks = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Filter, search and drag-and-drop tasks across your workflow.
          </p>
        </div>
        <Button variant="gradient" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-12">
        <div className="relative md:col-span-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus | "ALL")}>
          <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority | "ALL")}>
          <SelectTrigger className="md:col-span-2"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All priorities</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectId} onValueChange={(v) => setProjectId(v)}>
          <SelectTrigger className="md:col-span-3"><SelectValue placeholder="Project" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label className="flex items-center justify-center gap-2 rounded-md border border-input bg-background text-sm md:col-span-1 cursor-pointer">
          <input type="checkbox" className="accent-primary" checked={overdue} onChange={(e) => setOverdue(e.target.checked)} />
          Overdue
        </label>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-8 w-8" />}
              title="No tasks match your filters"
              description="Try clearing filters or creating a new task."
              action={<Button variant="gradient" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Create task</Button>}
            />
          ) : (
            <TaskBoardView tasks={tasks} />
          )}
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : tasks.length === 0 ? (
            <EmptyState title="No tasks" description="No tasks match the current filters." />
          ) : (
            <TaskTable tasks={tasks} />
          )}
        </TabsContent>
      </Tabs>

      <TaskFormDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
