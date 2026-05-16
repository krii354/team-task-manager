"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PriorityBadge, TaskStatusBadge } from "@/components/ui/status-badge";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn, formatDate, isOverdue } from "@/lib/utils";
import type { Task } from "@/lib/types";

export function TaskTable({ tasks }: { tasks: Task[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Task</th>
              <th className="px-4 py-3 text-left font-medium">Project</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Priority</th>
              <th className="px-4 py-3 text-left font-medium">Due</th>
              <th className="px-4 py-3 text-left font-medium">Assignee</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tasks.map((task) => {
              const overdue = isOverdue(task.dueDate, task.status);
              return (
                <tr key={task.id} className="transition-colors hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Link href={`/tasks/${task.id}`} className="font-medium hover:text-primary">
                      {task.title}
                    </Link>
                    {task.description && (
                      <p className="line-clamp-1 text-xs text-muted-foreground">{task.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {task.project ? (
                      <Link href={`/projects/${task.project.id}`} className="text-xs text-muted-foreground hover:text-primary">
                        {task.project.title}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><TaskStatusBadge status={task.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                  <td className={cn("px-4 py-3 text-xs", overdue && "text-destructive font-medium")}>
                    {task.dueDate ? (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar name={task.assignedTo.name} src={task.assignedTo.avatar} className="h-6 w-6 text-[10px]" />
                        <span className="text-xs">{task.assignedTo.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unassigned</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
