import type { Request, Response } from "express";
import { ActivityAction, Role } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { logActivity } from "../services/activity.service";
import type { CreateCommentInput } from "../validators/comment.validator";

async function assertTaskAccess(taskId: string, userId: string, role: Role) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: { include: { members: { select: { userId: true } } } } },
  });
  if (!task) throw ApiError.notFound("Task not found");
  if (role !== Role.ADMIN) {
    const isOwner = task.project.ownerId === userId;
    const isMember = task.project.members.some((m) => m.userId === userId);
    const isAssignee = task.assignedToId === userId;
    if (!isOwner && !isMember && !isAssignee) {
      throw ApiError.forbidden("You do not have access to this task");
    }
  }
  return task;
}

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { content, taskId } = req.body as CreateCommentInput;
  const userId = req.user!.id;
  const role = req.user!.role;
  const task = await assertTaskAccess(taskId, userId, role);

  const comment = await prisma.comment.create({
    data: { content, taskId, userId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  await logActivity({
    action: ActivityAction.COMMENT_ADDED,
    userId,
    projectId: task.projectId,
    taskId,
  });

  return sendCreated(res, comment, "Comment posted");
});

export const listCommentsForTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  await assertTaskAccess(req.params.taskId, userId, role);

  const comments = await prisma.comment.findMany({
    where: { taskId: req.params.taskId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    orderBy: { createdAt: "asc" },
  });
  return sendSuccess(res, comments, "Comments retrieved");
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;
  const comment = await prisma.comment.findUnique({ where: { id: req.params.id } });
  if (!comment) throw ApiError.notFound("Comment not found");
  if (role !== Role.ADMIN && comment.userId !== userId) {
    throw ApiError.forbidden("You can only delete your own comments");
  }
  await prisma.comment.delete({ where: { id: comment.id } });
  return sendSuccess(res, null, "Comment deleted");
});
