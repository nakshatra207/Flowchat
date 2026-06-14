import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { toObjectId } from "../utils/object-id.js";

export const listNotifications = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const notifications = await Notification.find({ recipient: req.user.id })
    .populate("actor", "username displayName avatarUrl")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ notifications });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const notification = await Notification.findOneAndUpdate(
    {
      _id: toObjectId(req.params.notificationId, "notification id"),
      recipient: req.user.id
    },
    { $set: { readAt: new Date() } },
    { new: true }
  );

  if (!notification) throw new AppError("Notification not found", 404);
  res.json({ notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  await Notification.updateMany(
    { recipient: req.user.id, readAt: null },
    { $set: { readAt: new Date() } }
  );

  res.status(204).send();
});

