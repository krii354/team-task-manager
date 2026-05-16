import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
  code?: string;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = "Success",
  statusCode = 200,
  meta?: PaginationMeta | Record<string, unknown>,
) {
  const payload: ApiSuccessResponse<T> = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

export function sendCreated<T>(res: Response, data: T, message = "Created successfully") {
  return sendSuccess(res, data, message, 201);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown,
  code?: string,
) {
  const payload: ApiErrorResponse = { success: false, message };
  if (errors !== undefined) payload.errors = errors;
  if (code) payload.code = code;
  return res.status(statusCode).json(payload);
}
