import Joi from "joi";
import { Router } from "express";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { objectId } from "../validators/common.validators.js";

export const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get("/", listNotifications);
notificationRouter.post("/read-all", markAllNotificationsRead);
notificationRouter.post(
  "/:notificationId/read",
  validate(Joi.object({ notificationId: objectId.required() }), "params"),
  markNotificationRead
);

