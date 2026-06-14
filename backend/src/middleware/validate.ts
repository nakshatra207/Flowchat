import type { RequestHandler } from "express";
import type { ObjectSchema } from "joi";
import { AppError } from "../utils/app-error.js";

type RequestPart = "body" | "params" | "query";

export function validate(schema: ObjectSchema, part: RequestPart = "body"): RequestHandler {
  return (req, _res, next) => {
    const { value, error } = schema.validate(req[part], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      next(new AppError(error.details.map((detail) => detail.message).join(", "), 400));
      return;
    }

    req[part] = value;
    next();
  };
}

