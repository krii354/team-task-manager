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
import { PROJECT_COLORS, PROJECT_STATUSES } from "@/lib/constants";
import type { Project, ProjectStatus } from "@/lib/types";
import { useCreateProject, useUpdateProject } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(120),
  description: z.string().trim().max(2000).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "ARCHIVED"] as const).optional(),
  deadline: z.string().optional(),
  color: z.string().optional(),
  memberIds: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project | null;
}

export function ProjectFormDialog({ open, onOpenChange, project }: Props) {
  const create = useCreateProject();
  const update = useUpdateProject(project?.id ?? "");
  const { data: usersResp } = useUsers({ pageSize: 100 });
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
      status: "PLANNING",
      deadline: "",
      color: PROJECT_COLORS[0],
      memberIds: [],
    },
  });

  useEffect(() => {
    if (project) {
      reset({
        title: project.title,
        description: project.description ?? "",
        status: project.status,
        deadline: project.deadline ? project.deadline.slice(0, 10) : "",
        color: project.color ?? PROJECT_COLORS[0],
        memberIds: project.members.map((m) => m.userId),
      });
    } else {
      reset({
        title: "",
        description: "",
        status: "PLANNING",
        deadline: "",
        color: PROJECT_COLORS[0],
        memberIds: [],
      });
    }
  }, [project, open, reset]);

  const color = watch("color");
  const selectedMembers = watch("memberIds") ?? [];

  const toggleMember = (id: string) => {
    const next = selectedMembers.includes(id)
      ? selectedMembers.filter((m) => m !== id)
      : [...selectedMembers, id];
    setValue("memberIds", next, { shouldDirty: true });
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
      description: values.description || undefined,
      status: values.status as ProjectStatus | undefined,
    };
    try {
      if (project) {
        await update.mutateAsync(payload);
      } else {
        await create.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch {
      /* toast handled in hook */
    }
  };

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{project ? "Edit project" : "Create project"}</DialogTitle>
          <DialogDescription>
            {project ? "Update project details and team." : "Spin up a new initiative for your team."}
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" placeholder="e.g. Mobile app redesign" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} placeholder="Goal, scope, success metrics..." {...register("description")} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v as ProjectStatus)}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {PROJECT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" {...register("deadline")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setValue("color", c, { shouldDirty: true })}
                  className={cn(
                    "h-8 w-8 rounded-full border-2 transition-all",
                    color === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary border-transparent" : "border-border",
                  )}
                  style={{ background: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Team members</Label>
            <div className="max-h-40 overflow-y-auto rounded-md border border-border p-2 space-y-1">
              {users.length === 0 && (
                <p className="text-xs text-muted-foreground p-2">No users available.</p>
              )}
              {users.map((u) => (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-[10px] font-semibold text-white">
                      {u.name.split(" ").slice(0, 2).map((p) => p[0]).join("")}
                    </span>
                    <span>
                      <span className="block font-medium">{u.name}</span>
                      <span className="block text-xs text-muted-foreground">{u.email}</span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border accent-primary"
                    checked={selectedMembers.includes(u.id)}
                    onChange={() => toggleMember(u.id)}
                  />
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" loading={isPending}>
              {project ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
