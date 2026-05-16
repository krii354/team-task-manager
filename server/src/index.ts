import path from "path";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import prisma from "./config/prisma";

/**
 * Resolve the directory where the built Next.js client lives.
 *
 *   dev:  d:\kritika\server\src\index.ts  →  d:\kritika\client
 *   prod: d:\kritika\server\dist\index.js →  d:\kritika\client
 */
function resolveClientDir(): string {
  if (env.CLIENT_DIR) return path.resolve(env.CLIENT_DIR);
  return path.resolve(__dirname, "..", "..", "client");
}

async function bootstrap() {
  const app = createApp();

  if (env.serveFrontend) {
    // Lazy-load `next` only when we're actually hosting the frontend.
    // This keeps boot fast for API-only deployments.
    // The interop dance accommodates both the CJS (function) and ESM (`.default`) shapes.
    const nextImport = (await import("next")) as unknown as {
      default?: typeof import("next").default;
    };
    const createNextApp = (nextImport.default ?? (nextImport as unknown)) as typeof import("next").default;

    const clientDir = resolveClientDir();
    logger.info(`Booting Next.js from: ${clientDir}`);

    const nextApp = createNextApp({
      dev: !env.isProduction,
      dir: clientDir,
      customServer: true,
    });
    const handle = nextApp.getRequestHandler();
    await nextApp.prepare();

    // Forward everything not matched by Express routes (i.e. non-API) to Next.js.
    app.all("*", (req, res) => {
      return handle(req, res);
    });
    logger.info("Next.js handler mounted at /*");
  }

  const server = app.listen(env.PORT, () => {
    const mode = env.serveFrontend ? "unified (API + Web)" : "API only";
    logger.info(`Server running on http://localhost:${env.PORT} — ${mode} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        logger.info("Database disconnected. Bye!");
        process.exit(0);
      } catch (err) {
        logger.error({ err }, "Error during shutdown");
        process.exit(1);
      }
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("unhandledRejection", (reason) => {
    logger.error({ reason }, "Unhandled promise rejection");
  });
  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception");
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, "Failed to bootstrap");
  process.exit(1);
});
