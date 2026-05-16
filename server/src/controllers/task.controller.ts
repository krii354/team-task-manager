import type { Request, Response } from "express";
import { ActivityAction, Prisma, Role, TaskPriority, TaskStatus } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { buildPaginationMeta, getPagination } from "../utils/pagination";
import { logActivity } from "../services/activity.service";
import { uploadFileBuffer } from "../services/upload.service";
import type { CreateTaskInput, UpdateTaskInput } from "../validators/task.validator";

const taskInclude = {
  assignedTo: { select: { id: true, name: true, email: true, avatar: true } },
  createdBy: { select: { id: true, name: true, email: true, avatar: true } },
  project: { select: { id: true, title: true, color: true } },
  _count: { select: { comments: true, attachments: true } },
} satisfies Prisma.TaskInclude;

async function ensureProjectAccess(projectId: string, userId: string, role: Role) {
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

async function ensureTaskAccess(taskId: string, userId: string, role: Role) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { select: { userId: true } } } } },
  });
  if (!task) throw ApiError.notFound("Task not found");
  if (role !== Role.ADMIN) {
    const project = task.project;
    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isOwner && !isMember) throw ApiError.forbidden("You do not have access to this task");
  }
  return task;
}

export const listTasks = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const userId = req.user!.id;
  const role = req.user!.role;
  const { search, status, priority, projectId, assignedToId, overdue } = req.query as Record<string, string | undefined>;

  const accessFilter: Prisma.TaskWhereInput =
    role === Role.ADMIN
      ? {}
      : {
          OR: [
            { assignedToId: userId },
            { createdById: userId },
            { project: { ownerId: userId } },
            { project: { members: { some: { userId } } } },
          ],
        };

  const where: Prisma.TaskWhereInput = {
    AND: [
      accessFilter,
      status ? { status: status as TaskStatus } : {},
      priority ? { priority: priority as TaskPriority } : {},
      projectId ? { projectId } : {},
      assignedToId ? { assignedToId } : {},
      overdue === "true"
        ? { dueDate: { lt: new Date() }, status: { not: TaskStatus.COMPLETED } }
        : {},
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [total, items] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return sendSuccess(res, items, "Tasks retrieved", 200, buildPaginationMeta(total, pagination));
});

export const getTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  await ensureTaskAccess(req.params.id, userId, role);

  const task = await prisma.task.findUnique({
    where: { id: req.params.id },
    include: {
      ...taskInclude,
      comments: {
        include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        orderBy: { createdAt: "asc" },
      },
      attachments: true,
      activities: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  return sendSuccess(res, task, "Task retrieved");
});

export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as CreateTaskInput;
  const userId = req.user!.id;
  const role = req.user!.role;
  await ensureProjectAccess(data.projectId, userId, role);

  if (data.assignedToId) {
    const assignee = await prisma.user.findUnique({ where: { id: data.assignedToId }, select: { id: true } });
    if (!assignee) throw ApiError.badRequest("Assignee user does not exist");
  }

  // Place new task at the end of its column.
  const maxOrder = await prisma.task.aggregate({
    where: { projectId: data.projectId, status: data.status ?? TaskStatus.TODO },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      status: data.status,
      dueDate: data.dueDate ?? null,
      projectId: data.projectId,
      assignedToId: data.assignedToId ?? null,
      createdById: userId,
      order: (maxOrder._max.order ?? 0) + 1,
    },
    include: taskInclude,
  });

  await logActivity({
    action: ActivityAction.TASK_CREATED,
    userId,
    projectId: data.projectId,
    taskId: task.id,
    metadata: { title: task.title },
  });

  if (task.assignedToId) {
    await logActivity({
      action: ActivityAction.TASK_ASSIGNED,
      userId,
      projectId: data.projectId,
      taskId: task.id,
      metadata: { assignedTo: task.assignedToId },
    });
  }

  return sendCreated(res, task, "Task created");
});

export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateTaskInput;
  const userId = req.user!.id;
  const role = req.user!.role;
  const existing = await ensureTaskAccess(req.params.id, userId, role);

  const isAdmin = role === Role.ADMIN;
  const isOwner = existing.project.ownerId === userId;
  const isAssignee = existing.assignedToId === userId;

  // Members can only change status of tasks assigned to them.
  if (!isAdmin && !isOwner) {
    const onlyStatus = Object.keys(data).every((k) => k === "status" || k === "order");
    if (!onlyStatus) throw ApiError.forbidden("Members can only update task status");
    if (!isAssignee) throw ApiError.forbidden("You are not assigned to this task");
  }

  const willComplete = data.status === TaskStatus.COMPLETED && existing.status !== TaskStatus.COMPLETED;
  const willReopen = data.status && data.status !== TaskStatus.COMPLETED && existing.status === TaskStatus.COMPLETED;

  const updated = await prisma.task.update({
    where: { id: existing.id },
    data: {
      ...data,
      completedAt: willComplete ? new Date() : willReopen ? null : undefined,
    },
    include: taskInclude,
  });

  if (data.status && data.status !== existing.status) {
    await logActivity({
      action: ActivityAction.TASK_STATUS_CHANGED,
      userId,
      projectId: existing.projectId,
      taskId: existing.id,
      metadata: { from: existing.status, to: data.status },
    });
  } else {
    await logActivity({
      action: ActivityAction.TASK_UPDATED,
      userId,
      projectId: existing.projectId,
      taskId: existing.id,
    });
  }

  if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
    await logActivity({
      action: ActivityAction.TASK_ASSIGNED,
      userId,
      projectId: existing.projectId,
      taskId: existing.id,
      metadata: { assignedTo: data.assignedToId },
    });
  }

  return sendSuccess(res, updated, "Task updated");
});

export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const existing = await ensureTaskAccess(req.params.id, userId, role);
  if (role !== Role.ADMIN && existing.project.ownerId !== userId) {
    throw ApiError.forbidden("Only admins or the project owner can delete tasks");
  }
  await prisma.task.delete({ where: { id: existing.id } });
  await logActivity({
    action: ActivityAction.TASK_DELETED,
    userId,
    projectId: existing.projectId,
    metadata: { taskId: existing.id, title: existing.title },
  });
  return sendSuccess(res, null, "Task deleted");
});

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const task = await ensureTaskAccess(req.params.id, userId, role);
  if (!req.file) throw ApiError.badRequest("File is required");

  const uploaded = await uploadFileBuffer(req.file.buffer, {
    folder: `team-task-manager/tasks/${task.id}`,
  });

  const attachment = await prisma.attachment.create({
    data: {
      taskId: task.id,
      fileName: req.file.originalname,
      fileUrl: uploaded.url,
      publicId: uploaded.publicId,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: userId,
    },
  });

  await logActivity({
    action: ActivityAction.ATTACHMENT_ADDED,
    userId,
    projectId: task.projectId,
    taskId: task.id,
    metadata: { fileName: attachment.fileName },
  });

  return sendCreated(res, attachment, "Attachment uploaded");
});
