import type { Request } from "express";
import type { PaginationMeta } from "./ApiResponse";

export interface PaginationParams {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function getPagination(req: Request, defaultPageSize = 20, maxPageSize = 100): PaginationParams {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const requested = parseInt(String(req.query.pageSize ?? req.query.limit ?? defaultPageSize), 10) || defaultPageSize;
  const pageSize = Math.min(maxPageSize, Math.max(1, requested));
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  return {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}
