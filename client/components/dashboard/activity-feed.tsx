"use client";

import { motion } from "framer-motion";
import { Activity, FolderPlus, FolderMinus, MessageSquare, Paperclip, UserPlus, UserMinus, CheckCircle, ListPlus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelative } from "@/lib/utils";
import type { ActivityAction, ActivityItem } from "@/lib/types";

const iconMap: Record<ActivityAction, typeof Activity> = {
  PROJECT_CREATED: FolderPlus,
  PROJECT_UPDATED: Pencil,
  PROJECT_DELETED: FolderMinus,
  MEMBER_ADDED: UserPlus,
  MEMBER_REMOVED: UserMinus,
  TASK_CREATED: ListPlus,
  TASK_UPDATED: Pencil,
  TASK_DELETED: Trash2,
  TASK_ASSIGNED: UserPlus,
  TASK_STATUS_CHANGED: CheckCircle,
  COMMENT_ADDED: MessageSquare,
  ATTACHMENT_ADDED: Paperclip,
};

function describe(item: ActivityItem): string {
  const target = item.task?.title ?? item.project?.title ?? "";
  switch (item.action) {
    case "PROJECT_CREATED": return `created project ${target}`;
    case "PROJECT_UPDATED": return `updated project ${target}`;
    case "PROJECT_DELETED": return `deleted a project`;
    case "MEMBER_ADDED": return `added a member to ${target}`;
    case "MEMBER_REMOVED": return `removed a member from ${target}`;
    case "TASK_CREATED": return `created task ${target}`;
    case "TASK_UPDATED": return `updated task ${target}`;
    case "TASK_DELETED": return `deleted a task`;
    case "TASK_ASSIGNED": return `assigned task ${target}`;
    case "TASK_STATUS_CHANGED": return `changed status of ${target}`;
    case "COMMENT_ADDED": return `commented on ${target}`;
    case "ATTACHMENT_ADDED": return `uploaded a file to ${target}`;
    default: return "did something";
  }
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest events across your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={<Activity className="h-8 w-8" />}
            title="No activity yet"
            description="Create a project or task to see activity here."
          />
        ) : (
          <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {items.map((item, i) => {
              const Icon = iconMap[item.action] ?? Activity;
              return (
                <motion.li
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.02 }}
                  className="flex items-start gap-3 rounded-lg border border-transparent p-2 hover:bg-accent/40 transition-colors"
                >
                  <UserAvatar name={item.user.name} src={item.user.avatar} className="h-8 w-8" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{item.user.name}</span>{" "}
                      <span className="text-muted-foreground">{describe(item)}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatRelative(item.createdAt)}</p>
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
