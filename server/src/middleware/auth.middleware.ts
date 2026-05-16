import type { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken } from "../utils/jwt";

function extractToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim();
  }
  if (req.cookies && typeof req.cookies.accessToken === "string") {
    return req.cookies.accessToken;
  }
  return null;
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) throw ApiError.unauthorized("Authentication token is missing");

    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized("Not authenticated"));
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    next();
  };
}

export const requireAdmin = requireRole(Role.ADMIN);
