import { z } from "zod";
import { Role } from "@prisma/client";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: passwordSchema,
  role: z.nativeEnum(Role).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, "Invalid refresh token").optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
