import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, "Comment is required").max(2000, "Comment is too long"),
  taskId: z.string().cuid("Invalid task id"),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
