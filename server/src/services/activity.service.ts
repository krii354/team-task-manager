import { ActivityAction, Prisma } from "@prisma/client";
import prisma from "../config/prisma";

interface LogActivityInput {
  action: ActivityAction;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

export async function logActivity(input: LogActivityInput) {
  return prisma.activity.create({
    data: {
      action: input.action,
      userId: input.userId,
      projectId: input.projectId ?? null,
      taskId: input.taskId ?? null,
      metadata: input.metadata,
    },
  });
}

export async function getRecentActivities(opts?: {
  limit?: number;
  projectId?: string;
  userId?: string;
}) {
  const { limit = 20, projectId, userId } = opts ?? {};
  return prisma.activity.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      project: { select: { id: true, title: true } },
      task: { select: { id: true, title: true } },
    },
  });
}
