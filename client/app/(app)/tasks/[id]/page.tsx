"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CalendarClock, MessageSquare, Paperclip, Pencil, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityBadge, TaskStatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TaskFormDialog } from "@/components/tasks/task-form-dialog";
import { useDeleteTask, useTask, useUploadTaskAttachment } from "@/hooks/use-tasks";
import { useAddComment, useDeleteComment, useTaskComments } from "@/hooks/use-comments";
import { useAuthStore } from "@/store/auth.store";
import { cn, formatDate, formatRelative, isOverdue } from "@/lib/utils";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: task, isLoading } = useTask(params.id);
  const { data: comments } = useTaskComments(params.id);
  const addComment = useAddComment(params.id);
  const deleteComment = useDeleteComment(params.id);
  const deleteTask = useDeleteTask();
  const uploadAttachment = useUploadTaskAttachment(params.id);
  const user = useAuthStore((s) => s.user);

  const [comment, setComment] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading || !task) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const canManage = user?.role === "ADMIN" || task.createdById === user?.id;
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tasks"><ArrowLeft className="h-4 w-4" /> Back to tasks</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <TaskStatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.project && (
                    <Link href={`/projects/${task.project.id}`} className="text-xs text-muted-foreground hover:text-primary">
                      in {task.project.title}
                    </Link>
                  )}
                </div>
                <CardTitle className="text-2xl">{task.title}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                {canManage && (
                  <Button variant="destructive" size="sm" onClick={() => setConfirmOpen(true)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg bg-muted/30 p-4 text-sm whitespace-pre-wrap">
              {task.description || <span className="text-muted-foreground">No description provided.</span>}
            </div>

            <Separator />

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Paperclip className="h-4 w-4" /> Attachments ({task.attachments?.length ?? 0})
              </h3>
              {task.attachments && task.attachments.length > 0 ? (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {task.attachments.map((att) => (
                    <li key={att.id}>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-3 rounded-lg border border-border p-2 text-sm transition-colors hover:bg-accent"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <Paperclip className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{att.fileName}</p>
                          {att.fileSize && <p className="text-xs text-muted-foreground">{Math.round(att.fileSize / 1024)} KB</p>}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No attachments yet.</p>
              )}
              <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-xs hover:bg-accent">
                <Upload className="h-3.5 w-3.5" />
                {uploadAttachment.isPending ? "Uploading..." : "Upload file"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAttachment.mutate(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <Separator />

            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <MessageSquare className="h-4 w-4" /> Comments ({comments?.length ?? 0})
              </h3>
              <ul className="space-y-3">
                {(comments ?? []).map((c) => (
                  <li key={c.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <UserAvatar name={c.user.name} src={c.user.avatar} className="h-7 w-7" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{c.user.name}</span>
                          <span>•</span>
                          <span>{formatRelative(c.createdAt)}</span>
                        </div>
                        {(user?.role === "ADMIN" || c.userId === user?.id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteComment.mutate(c.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap">{c.content}</p>
                    </div>
                  </li>
                ))}
                {(!comments || comments.length === 0) && (
                  <li className="text-xs text-muted-foreground">No comments yet. Be the first to share an update.</li>
                )}
              </ul>

              <form
                className="mt-4 space-y-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!comment.trim()) return;
                  await addComment.mutateAsync(comment.trim());
                  setComment("");
                }}
              >
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" variant="gradient" size="sm" loading={addComment.isPending} disabled={!comment.trim()}>
                    Post comment
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Assignee</span>
                {task.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar name={task.assignedTo.name} src={task.assignedTo.avatar} className="h-6 w-6 text-[10px]" />
                    <span>{task.assignedTo.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unassigned</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Reporter</span>
                {task.createdBy ? <span>{task.createdBy.name}</span> : <span className="text-muted-foreground">—</span>}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Due date</span>
                <span className={cn("flex items-center gap-1", overdue && "text-destructive font-medium")}>
                  <CalendarClock className="h-3 w-3" />
                  {task.dueDate ? formatDate(task.dueDate) : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Created</span>
                <span>{formatRelative(task.createdAt)}</span>
              </div>
              {task.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Completed</span>
                  <span>{formatRelative(task.completedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 max-h-80 overflow-y-auto">
                {(task.activities ?? []).slice(0, 30).map((a) => (
                  <li key={a.id} className="flex items-start gap-2 text-xs">
                    <UserAvatar name={a.user.name} src={a.user.avatar} className="h-5 w-5 text-[9px]" />
                    <div className="flex-1">
                      <span className="font-medium">{a.user.name}</span>{" "}
                      <span className="text-muted-foreground">{a.action.replace(/_/g, " ").toLowerCase()}</span>
                      <div className="text-[10px] text-muted-foreground">{formatRelative(a.createdAt)}</div>
                    </div>
                  </li>
                ))}
                {(!task.activities || task.activities.length === 0) && (
                  <li className="text-xs text-muted-foreground">No activity yet.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <TaskFormDialog open={editOpen} onOpenChange={setEditOpen} task={task} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            All comments, attachments and activity will be permanently removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              loading={deleteTask.isPending}
              onClick={async () => {
                await deleteTask.mutateAsync(task.id);
                router.push("/tasks");
              }}
            >
              Delete task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
