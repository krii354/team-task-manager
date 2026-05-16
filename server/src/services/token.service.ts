import { randomUUID } from "crypto";
import { Role } from "@prisma/client";
import prisma from "../config/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { env } from "../config/env";
import { ApiError } from "../utils/ApiError";

function parseExpiryToMs(value: string): number {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const num = parseInt(match[1], 10);
  switch (match[2]) {
    case "s": return num * 1000;
    case "m": return num * 60 * 1000;
    case "h": return num * 60 * 60 * 1000;
    case "d": return num * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export async function issueTokens(user: { id: string; email: string; role: Role }): Promise<IssuedTokens> {
  const jti = randomUUID();
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, jti });

  const expiresAt = new Date(Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshTokenExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  };
}

export async function rotateRefreshToken(oldToken: string): Promise<IssuedTokens> {
  let payload;
  try {
    payload = verifyRefreshToken(oldToken);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
  if (!stored || stored.revoked || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is no longer valid");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) throw ApiError.unauthorized("User not found or inactive");

  await prisma.refreshToken.update({ where: { token: oldToken }, data: { revoked: true } });
  return issueTokens(user);
}

export async function revokeRefreshToken(token: string) {
  await prisma.refreshToken.updateMany({ where: { token }, data: { revoked: true } });
}

export async function revokeAllUserTokens(userId: string) {
  await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
}
