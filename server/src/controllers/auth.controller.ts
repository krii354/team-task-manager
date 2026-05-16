import type { Request, Response } from "express";
import { Role } from "@prisma/client";
import prisma from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { sendCreated, sendSuccess } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { comparePassword, hashPassword } from "../utils/password";
import { issueTokens, revokeAllUserTokens, revokeRefreshToken, rotateRefreshToken } from "../services/token.service";
import type { LoginInput, SignupInput } from "../validators/auth.validator";
import { env } from "../config/env";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function publicUser(u: { id: string; name: string; email: string; role: Role; avatar: string | null; bio: string | null }) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, bio: u.bio };
}

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body as SignupInput;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  // The very first user becomes ADMIN automatically. Subsequent users default to MEMBER.
  const userCount = await prisma.user.count();
  const finalRole: Role = userCount === 0 ? Role.ADMIN : role ?? Role.MEMBER;

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: finalRole },
    select: { id: true, name: true, email: true, role: true, avatar: true, bio: true },
  });

  const tokens = await issueTokens(user);
  res.cookie("refreshToken", tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendCreated(res, { user: publicUser(user), ...tokens }, "Account created successfully");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw ApiError.unauthorized("Invalid email or password");

  const ok = await comparePassword(password, user.password);
  if (!ok) throw ApiError.unauthorized("Invalid email or password");

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokens(user);
  res.cookie("refreshToken", tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

  return sendSuccess(res, { user: publicUser(user), ...tokens }, "Logged in successfully");
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const provided = (req.body?.refreshToken as string | undefined) ?? req.cookies?.refreshToken;
  if (!provided) throw ApiError.unauthorized("Refresh token is required");

  const tokens = await rotateRefreshToken(provided);
  res.cookie("refreshToken", tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
  return sendSuccess(res, tokens, "Tokens refreshed");
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const provided = (req.body?.refreshToken as string | undefined) ?? req.cookies?.refreshToken;
  if (provided) await revokeRefreshToken(provided);
  if (req.user?.id) await revokeAllUserTokens(req.user.id);
  res.clearCookie("refreshToken", { path: "/api/auth" });
  return sendSuccess(res, null, "Logged out successfully");
});
