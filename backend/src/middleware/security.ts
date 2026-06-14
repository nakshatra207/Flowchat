import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import type { Express } from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { env } from "../config/env.js";
import { xssProtection } from "./xss-protection.js";

export function applySecurityMiddleware(app: Express): void {
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    })
  );

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    })
  );

  app.use(
    rateLimit({
      windowMs: env.rateLimitWindowMs,
      limit: env.rateLimitMaxRequests,
      standardHeaders: "draft-8",
      legacyHeaders: false
    })
  );

  app.use(compression());
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(xssProtection);
  app.use(hpp());

  if (!env.isTest) {
    app.use(morgan(env.isProduction ? "combined" : "dev"));
  }
}
