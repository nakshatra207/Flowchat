import { Attachment } from "../models/attachment.model.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { toObjectId } from "../utils/object-id.js";

function attachmentKind(mimeType: string): "image" | "video" | "pdf" | "file" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "file";
}

export const updateProfile = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const user = await User.findByIdAndUpdate(req.user.id, { $set: req.body }, { new: true });
  res.json({ user });
});

export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!req.file) throw new AppError("Avatar file is required", 400);

  const url = `/uploads/${req.file.filename}`;
  await Attachment.create({
    owner: req.user.id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url,
    kind: attachmentKind(req.file.mimetype)
  });

  const user = await User.findByIdAndUpdate(req.user.id, { $set: { avatarUrl: url } }, { new: true });
  res.json({ user });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q, limit } = req.query as unknown as { q: string; limit: number };
  const users = await User.find(
    {
      isActive: true,
      $text: { $search: q }
    },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit);

  res.json({ users });
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: toObjectId(req.params.userId, "user id"), isActive: true });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.json({ user });
});
