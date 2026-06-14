import express from "express";
import path from "node:path";
import { env } from "./config/env.js";
import { notFoundHandler, errorHandler } from "./middleware/error-handler.js";
import { applySecurityMiddleware } from "./middleware/security.js";
import { apiRouter } from "./routes/index.js";

export function createApp() {
  const app = express();

  applySecurityMiddleware(app);

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use("/uploads", express.static(path.resolve(process.cwd(), env.uploadDir)));
  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
