import { z } from "zod";
import { ProjectStatus } from "@prisma/client";

export const createProjectSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(120),
  description: z.string().trim().max(2000).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  deadline: z
    .union([z.string().datetime(), z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.date()])
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color")
    .optional(),
  memberIds: z.array(z.string().cuid("Invalid user id")).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export const projectMembersSchema = z.object({
  memberIds: z.array(z.string().cuid()).min(1, "Provide at least one member id"),
});

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
