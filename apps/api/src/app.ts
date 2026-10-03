import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { ZodError } from "zod";

import { config } from "./config.js";
import { dbStatus } from "./db.js";
import { logger } from "./logger.js";

export function createApp(): express.Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(pinoHttp({ logger }));

  // Health check used by Render and keep-alive pings.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", db: dbStatus(), uptime: process.uptime() });
  });

  // Chat: 30 requests/min, uploads: 10/min (Section 13).
  app.use("/api/chat", rateLimit({ windowMs: 60_000, limit: 30 }));
  app.use("/api/documents", rateLimit({ windowMs: 60_000, limit: 10, skip: (req) => req.method !== "POST" }));

  // --- Routes are added in later phases ---

  // 404
  app.use((_req, res) => {
    res.status(404).json({ code: "not_found", message: "Not found" });
  });

  // Central error handler returning `{ code, message }`.
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json({ code: "validation_error", message: error.message });
      return;
    }
    const status = typeof error?.status === "number" ? error.status : 500;
    const code = typeof error?.code === "string" ? error.code : "internal";
    const message = status === 500 ? "Internal server error" : String(error?.message ?? error);
    if (status >= 500) logger.error({ err: error }, "Unhandled error");
    res.status(status).json({ code, message });
  };
  app.use(errorHandler);

  return app;
}
