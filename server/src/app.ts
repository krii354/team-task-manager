import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import hpp from "hpp";
import xssClean from "xss-clean";

// types/express.d.ts augments Express's Request type globally — picked up by tsc automatically.
import { env } from "./config/env";
import { generalLimiter } from "./middleware/rateLimit.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import routes from "./routes";

export function createApp(): Express {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: env.corsOrigins.length === 1 ? env.corsOrigins[0] : env.corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(cookieParser());
  app.use(compression());
  app.use(hpp());
  app.use(xssClean());

  if (!env.isTest) {
    app.use(morgan(env.isDevelopment ? "dev" : "combined"));
  }

  app.use("/api", generalLimiter, routes);

  // When the frontend isn't served here (dev mode), expose a tiny landing page.
  if (!env.serveFrontend) {
    app.get("/", (_req, res) => {
      res.json({
        success: true,
        message: "Team Task Manager API",
        version: "1.0.0",
        docs: "/api/health",
      });
    });
    app.use(notFoundHandler);
  }

  app.use(errorHandler);

  return app;
}
