import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 chars"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 chars"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  CLIENT_URL: z.string().default("http://localhost:3000"),

  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  LOG_LEVEL: z.string().default("info"),

  // When true (auto-true in production), Express also serves the Next.js frontend
  // from the same process / port — used for the single-service Railway deploy.
  SERVE_FRONTEND: z.string().optional(),
  CLIENT_DIR: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed. Check your .env file.");
}

const isProduction = parsed.data.NODE_ENV === "production";

export const env = {
  ...parsed.data,
  isProduction,
  isDevelopment: parsed.data.NODE_ENV === "development",
  isTest: parsed.data.NODE_ENV === "test",
  corsOrigins: parsed.data.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean),
  serveFrontend:
    parsed.data.SERVE_FRONTEND === "true" ||
    (isProduction && parsed.data.SERVE_FRONTEND !== "false"),
};

export type AppEnv = typeof env;
