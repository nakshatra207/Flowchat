import type { RequestHandler } from "express";
import { User } from "../models/user.model.js";
import { verifyAccessToken } from "../services/token.service.js";
import { AppError } from "../utils/app-error.js";

export const authenticate: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) {
      next(new AppError("Authentication required", 401));
      return;
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("_id role tokenVersion isActive");

    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
      next(new AppError("Invalid or expired session", 401));
      return;
    }

    req.user = {
      id: user.id,
      role: user.role as "user" | "admin" | "moderator",
      tokenVersion: Number(user.tokenVersion)
    };
    next();
  } catch {
    next(new AppError("Invalid or expired session", 401));
  }
};

export function authorize(...roles: Array<"user" | "admin" | "moderator">): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError("Authentication required", 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError("Insufficient permissions", 403));
      return;
    }

    next();
  };
}
