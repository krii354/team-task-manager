import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { sendError } from "../utils/ApiResponse";
import { env } from "../config/env";
import { logger } from "../config/logger";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  let statusCode = 500;
  let message = "Internal Server Error";
  let errors: unknown = undefined;
  let code: string | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed";
    errors = err.flatten().fieldErrors;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      message = `A record with this ${target} already exists`;
      code = err.code;
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Resource not found";
      code = err.code;
    } else if (err.code === "P2003") {
      statusCode = 400;
      message = "Foreign key constraint failed";
      code = err.code;
    } else {
      statusCode = 400;
      message = "Database request error";
      code = err.code;
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Invalid database query parameters";
  } else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Token expired";
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token";
  } else if (err instanceof Error) {
    message = err.message || message;
  }

  if (statusCode >= 500) {
    logger.error({ err }, "Unhandled error");
  } else {
    logger.warn({ statusCode, message }, "Handled request error");
  }

  return sendError(res, statusCode, message, errors, code);
}
