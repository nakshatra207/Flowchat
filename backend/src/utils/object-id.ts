import { Types } from "mongoose";
import { AppError } from "./app-error.js";

export function toObjectId(value: unknown, label = "id"): Types.ObjectId {
  const normalized = String(value);

  if (!Types.ObjectId.isValid(normalized)) {
    throw new AppError(`Invalid ${label}`, 400);
  }

  return new Types.ObjectId(normalized);
}
