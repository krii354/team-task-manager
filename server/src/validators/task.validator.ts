import { z } from "zod";
import { TaskPriority, TaskStatus } from "@prisma/client";

const dateOrIso = z
  .union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
  .optional()
  .nullable()
  .transform((v) => (v ? new Date(v) : null));

export const createTaskSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(160),
  description: z.string().trim().max(5000).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: dateOrIso,
  projectId: z.string().cuid("Invalid project id"),
  assignedToId: z.string().cuid("Invalid user id").optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  description: z.string().trim().max(5000).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  dueDate: dateOrIso,
  assignedToId: z.string().cuid().optional().nullable(),
  order: z.number().int().optional(),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  projectId: z.string().cuid().optional(),
  assignedToId: z.string().cuid().optional(),
  overdue: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
