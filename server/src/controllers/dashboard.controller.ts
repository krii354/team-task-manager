import type { Request, Response } from "express";
import { Prisma, Role, TaskStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { getRecentActivities } from "../services/activity.service";

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const isAdmin = role === Role.ADMIN;

  const projectFilter: Prisma.ProjectWhereInput = isAdmin
    ? {}
    : { OR: [{ ownerId: userId }, { members: { some: { userId } } }] };

  const taskFilter: Prisma.TaskWhereInput = isAdmin
    ? {}
    : {
        OR: [
          { assignedToId: userId },
          { createdById: userId },
          { project: { ownerId: userId } },
          { project: { members: { some: { userId } } } },
        ],
      };

  const now = new Date();

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    todoTasks,
    inProgressTasks,
    reviewTasks,
    completedTasks,
    overdueTasks,
    totalMembers,
  ] = await Promise.all([
    prisma.project.count({ where: projectFilter }),
    prisma.project.count({ where: { ...projectFilter, status: "ACTIVE" } }),
    prisma.project.count({ where: { ...projectFilter, status: "COMPLETED" } }),
    prisma.task.count({ where: taskFilter }),
    prisma.task.count({ where: { ...taskFilter, status: TaskStatus.TODO } }),
    prisma.task.count({ where: { ...taskFilter, status: TaskStatus.IN_PROGRESS } }),
    prisma.task.count({ where: { ...taskFilter, status: TaskStatus.REVIEW } }),
    prisma.task.count({ where: { ...taskFilter, status: TaskStatus.COMPLETED } }),
    prisma.task.count({
      where: { ...taskFilter, dueDate: { lt: now }, status: { not: TaskStatus.COMPLETED } },
    }),
    isAdmin ? prisma.user.count() : Promise.resolve(0),
  ]);

  const priorityBreakdown = await prisma.task.groupBy({
    by: ["priority"],
    where: taskFilter,
    _count: { _all: true },
  });

  // Last 6 months of completion trend
  const monthsBack = 6;
  const since = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);
  const recentCompleted = await prisma.task.findMany({
    where: {
      ...taskFilter,
      status: TaskStatus.COMPLETED,
      completedAt: { gte: since },
    },
    select: { completedAt: true },
  });

  const monthly: { month: string; completed: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString("default", { month: "short", year: "numeric" });
    const count = recentCompleted.filter(
      (t) => t.completedAt && t.completedAt.getMonth() === d.getMonth() && t.completedAt.getFullYear() === d.getFullYear(),
    ).length;
    monthly.push({ month: key, completed: count });
  }

  const recentActivities = await getRecentActivities({
    limit: 15,
    ...(isAdmin ? {} : { userId }),
  });

  const pendingTasks = totalTasks - completedTasks;
  const productivity = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return sendSuccess(res, {
    cards: {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
      totalMembers,
      productivity,
    },
    statusBreakdown: {
      todo: todoTasks,
      inProgress: inProgressTasks,
      review: reviewTasks,
      completed: completedTasks,
    },
    priorityBreakdown: priorityBreakdown.map((p) => ({ priority: p.priority, count: p._count._all })),
    completionTrend: monthly,
    recentActivities,
  }, "Dashboard data retrieved");
});
