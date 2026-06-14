import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../utils/app-error.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const normalizedError =
    error instanceof AppError ? error : new AppError("Internal server error", 500, false);

  if (normalizedError.statusCode >= 500) {
    logger.error(normalizedError.message, {
      stack: normalizedError.stack,
      operational: normalizedError.isOperational
    });
  }

  res.status(normalizedError.statusCode).json({
    status: "error",
    message: normalizedError.message,
    ...(env.isProduction ? {} : { stack: normalizedError.stack })
  });
};
