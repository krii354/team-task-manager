"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, Pencil, Trash2, Users2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectStatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Separator } from "@/components/ui/separator";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";
import { useDeleteProject, useProject, useRemoveProjectMember } from "@/hooks/use-projects";
import { useAuthStore } from "@/store/auth.store";
import { formatDate } from "@/lib/utils";
import { TaskBoard } from "@/components/tasks/task-board";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: project, isLoading } = useProject(params.id);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN";
  const canManage = isAdmin || project?.ownerId === user?.id;
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const removeMember = useRemoveProjectMember(params.id);
  const deleteProject = useDeleteProject();

  if (isLoading || !project) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/projects"><ArrowLeft className="h-4 w-4" /> Back</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div
                className="h-12 w-12 shrink-0 rounded-xl"
                style={{ background: `linear-gradient(135deg, ${project.color ?? "#6366f1"}, ${project.color ?? "#6366f1"}aa)` }}
              />
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {project.description ?? "No description provided."}
                </p>
              </div>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress ?? 0}%</span>
                </div>
                <Progress value={project.progress ?? 0} />
              </div>
              {project.stats && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: "Total", value: project.stats.total },
                    { label: "To Do", value: project.stats.todo },
                    { label: "In Progress", value: project.stats.inProgress },
                    { label: "Completed", value: project.stats.completed },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                      <div className="text-xl font-semibold">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Deadline:</span>
                <span className="font-medium">{project.deadline ? formatDate(project.deadline) : "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Owner:</span>
                <span className="font-medium">{project.owner.name}</span>
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Team</p>
                <ul className="space-y-2">
                  {project.members.length === 0 && (
                    <li className="text-xs text-muted-foreground">No additional members yet.</li>
                  )}
                  {project.members.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar name={m.user.name} src={m.user.avatar} className="h-7 w-7" />
                        <div className="min-w-0">
                          <p className="truncate text-sm">{m.user.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                        </div>
                      </div>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeMember.mutate(m.userId)}
                          aria-label="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Tasks</h2>
        <TaskBoard projectId={project.id} />
      </div>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={project} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this project?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            All tasks, comments and attachments will be permanently removed. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              loading={deleteProject.isPending}
              onClick={async () => {
                await deleteProject.mutateAsync(project.id);
                router.push("/projects");
              }}
            >
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
