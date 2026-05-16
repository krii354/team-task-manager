"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";

const schema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const),
  status: z.enum(["TODO", "IN_PROGRESS", "REVIEW", "COMPLETED"] as const),
  dueDate: z.string().optional(),
  projectId: z.string().min(1, "Select a project"),
  assignedToId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  defaultProjectId?: string;
  defaultStatus?: TaskStatus;
}

export function TaskFormDialog({ open, onOpenChange, task, defaultProjectId, defaultStatus }: Props) {
  const create = useCreateTask();
  const update = useUpdateTask(task?.id ?? "");
  const { data: projectsResp } = useProjects({ pageSize: 100 });
  const { data: usersResp } = useUsers({ pageSize: 100 });
  const projects = projectsResp?.items ?? [];
  const users = usersResp?.items ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      status: defaultStatus ?? "TODO",
      dueDate: "",
      projectId: defaultProjectId ?? "",
      assignedToId: "",
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        projectId: task.projectId,
        assignedToId: task.assignedToId ?? "",
      });
    } else {
      reset({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: defaultStatus ?? "TODO",
        dueDate: "",
        projectId: defaultProjectId ?? "",
        assignedToId: "",
      });
    }
  }, [task, defaultProjectId, defaultStatus, open, reset]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
      assignedToId: values.assignedToId || null,
      description: values.description || undefined,
    };
    try {
      if (task) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      /* handled */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? "Edit task" : "Create task"}</DialogTitle>
          <DialogDescription>Capture work, assign owners and set deadlines.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Design empty state for dashboard" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} placeholder="Acceptance criteria, links, context..." {...register("description")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={watch("projectId")} onValueChange={(v) => setValue("projectId", v)} disabled={!!defaultProjectId}>
                <SelectTrigger><SelectValue placeholder="Choose project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={watch("assignedToId") || "__UNASSIGNED__"} onValueChange={(v) => setValue("assignedToId", v === "__UNASSIGNED__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__UNASSIGNED__">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as TaskStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="gradient" loading={create.isPending || update.isPending}>
              {task ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
