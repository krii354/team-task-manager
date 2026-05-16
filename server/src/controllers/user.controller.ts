import type { Request, Response } from "express";
import { Prisma, Role } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { buildPaginationMeta, getPagination } from "../utils/pagination";
import { comparePassword, hashPassword } from "../utils/password";
import type {
  AdminUpdateUserInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from "../validators/user.validator";
import { revokeAllUserTokens } from "../services/token.service";

const publicSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  bio: true,
  isActive: true,
  createdAt: true,
  lastLoginAt: true,
} satisfies Prisma.UserSelect;

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: publicSelect,
  });
  if (!user) throw ApiError.notFound("User not found");
  return sendSuccess(res, user, "Profile retrieved");
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const data = req.body as UpdateProfileInput;
  const updated = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: publicSelect,
  });
  return sendSuccess(res, updated, "Profile updated");
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body as ChangePasswordInput;
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw ApiError.notFound("User not found");
  const ok = await comparePassword(currentPassword, user.password);
  if (!ok) throw ApiError.unauthorized("Current password is incorrect");

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  await revokeAllUserTokens(user.id);

  return sendSuccess(res, null, "Password changed. Please log in again.");
});

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const pagination = getPagination(req);
  const search = (req.query.search as string | undefined)?.trim();
  const role = req.query.role as Role | undefined;

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: publicSelect,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  return sendSuccess(res, items, "Users retrieved", 200, buildPaginationMeta(total, pagination));
});

export const updateUserByAdmin = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const data = req.body as AdminUpdateUserInput;

  if (req.user?.id === userId && data.role && data.role !== Role.ADMIN) {
    throw ApiError.badRequest("You cannot demote your own admin account");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: publicSelect,
  });

  if (data.isActive === false) {
    await revokeAllUserTokens(userId);
  }

  return sendSuccess(res, updated, "User updated");
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.id;
  if (userId === req.user?.id) throw ApiError.badRequest("You cannot delete your own account");
  await prisma.user.delete({ where: { id: userId } });
  return sendSuccess(res, null, "User deleted");
});
