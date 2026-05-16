import type { Request, Response } from "express";
import { ActivityAction, Prisma, ProjectStatus, Role, TaskStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { buildPaginationMeta, getPagination } from "../utils/pagination";
import { logActivity } from "../services/activity.service";
import type { CreateProjectInput, UpdateProjectInput } from "../validators/project.validator";

const projectInclude = {
  owner: { select: { id: true, name: true, email: true, avatar: true } },
  members: {
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true, role: true } },
    },
  },
  _count: { select: { tasks: true, members: true } },
} satisfies Prisma.ProjectInclude;

async function assertProjectAccess(projectId: string, userId: string, role: Role) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { select: { userId: true } } },
  });
  if (!project) throw ApiError.notFound("Project not found");

  if (role !== Role.ADMIN) {
    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isOwner && !isMember) throw ApiError.forbidden("You do not have access to this project");
  }
  return project;
}

async function computeProgress(projectId: string): Promise<number> {
  const [total, completed] = await Promise.all([
    prisma.task.count({ where: { projectId } }),
    prisma.task.count({ where: { projectId, status: TaskStatus.COMPLETED } }),
  ]);
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const search = (req.query.search as string | undefined)?.trim();
  const status = req.query.status as ProjectStatus | undefined;
  const userId = req.user!.id;
  const role = req.user!.role;

  const where: Prisma.ProjectWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(role !== Role.ADMIN
      ? {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: projectInclude,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  const withProgress = await Promise.all(
    items.map(async (p) => ({ ...p, progress: await computeProgress(p.id) })),
  );

  return sendSuccess(res, withProgress, "Projects retrieved", 200, buildPaginationMeta(total, pagination));
});

export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  await assertProjectAccess(req.params.id, userId, role);

  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: projectInclude,
  });
  if (!project) throw ApiError.notFound("Project not found");

  const [progress, taskStats] = await Promise.all([
    computeProgress(project.id),
    prisma.task.groupBy({
      by: ["status"],
      where: { projectId: project.id },
      _count: { _all: true },
    }),
  ]);

  const stats = {
    total: taskStats.reduce((s, t) => s + t._count._all, 0),
    todo: taskStats.find((t) => t.status === TaskStatus.TODO)?._count._all ?? 0,
    inProgress: taskStats.find((t) => t.status === TaskStatus.IN_PROGRESS)?._count._all ?? 0,
    review: taskStats.find((t) => t.status === TaskStatus.REVIEW)?._count._all ?? 0,
    completed: taskStats.find((t) => t.status === TaskStatus.COMPLETED)?._count._all ?? 0,
  };

  return sendSuccess(res, { ...project, progress, stats }, "Project retrieved");
});

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateProjectInput;
  const userId = req.user!.id;

  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        deadline: data.deadline,
        color: data.color,
        ownerId: userId,
        members: data.memberIds?.length
          ? { create: data.memberIds.filter((id) => id !== userId).map((userId) => ({ userId })) }
          : undefined,
      },
      include: projectInclude,
    });
    return created;
  });

  await logActivity({
    action: ActivityAction.PROJECT_CREATED,
    userId,
    projectId: project.id,
    metadata: { title: project.title },
  });

  return sendCreated(res, { ...project, progress: 0 }, "Project created");
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateProjectInput;
  const userId = req.user!.id;
  const role = req.user!.role;
  const project = await assertProjectAccess(req.params.id, userId, role);

  if (role !== Role.ADMIN && project.ownerId !== userId) {
    throw ApiError.forbidden("Only the project owner or an admin can update this project");
  }

  const { memberIds, ...rest } = data;
  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.project.update({
      where: { id: project.id },
      data: rest,
      include: projectInclude,
    });
    if (memberIds) {
      await tx.projectMember.deleteMany({ where: { projectId: project.id } });
      if (memberIds.length) {
        await tx.projectMember.createMany({
          data: memberIds.filter((id) => id !== project.ownerId).map((userId) => ({ projectId: project.id, userId })),
          skipDuplicates: true,
        });
      }
    }
    return tx.project.findUnique({ where: { id: project.id }, include: projectInclude });
  });

  await logActivity({
    action: ActivityAction.PROJECT_UPDATED,
    userId,
    projectId: project.id,
  });

  const progress = await computeProgress(project.id);
  return sendSuccess(res, { ...updated, progress }, "Project updated");
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const project = await assertProjectAccess(req.params.id, userId, role);
  if (role !== Role.ADMIN && project.ownerId !== userId) {
    throw ApiError.forbidden("Only the project owner or an admin can delete this project");
  }
  await prisma.project.delete({ where: { id: project.id } });
  await logActivity({
    action: ActivityAction.PROJECT_DELETED,
    userId,
    metadata: { projectId: project.id, title: project.title },
  });
  return sendSuccess(res, null, "Project deleted");
});

export const addMembers = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const project = await assertProjectAccess(req.params.id, userId, role);
  if (role !== Role.ADMIN && project.ownerId !== userId) {
    throw ApiError.forbidden("Only the project owner or an admin can manage members");
  }
  const memberIds = (req.body.memberIds as string[]).filter((id) => id !== project.ownerId);

  await prisma.projectMember.createMany({
    data: memberIds.map((uid) => ({ projectId: project.id, userId: uid })),
    skipDuplicates: true,
  });

  for (const uid of memberIds) {
    await logActivity({
      action: ActivityAction.MEMBER_ADDED,
      userId,
      projectId: project.id,
      metadata: { addedUserId: uid },
    });
  }

  const refreshed = await prisma.project.findUnique({
    where: { id: project.id },
    include: projectInclude,
  });
  return sendSuccess(res, refreshed, "Members added");
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const project = await assertProjectAccess(req.params.id, userId, role);
  if (role !== Role.ADMIN && project.ownerId !== userId) {
    throw ApiError.forbidden("Only the project owner or an admin can manage members");
  }
  const memberUserId = req.params.userId;

  await prisma.projectMember.deleteMany({
    where: { projectId: project.id, userId: memberUserId },
  });

  await logActivity({
    action: ActivityAction.MEMBER_REMOVED,
    userId,
    projectId: project.id,
    metadata: { removedUserId: memberUserId },
  });

  return sendSuccess(res, null, "Member removed");
});
