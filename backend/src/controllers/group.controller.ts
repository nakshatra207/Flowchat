import { Conversation } from "../models/conversation.model.js";
import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";
import { Attachment } from "../models/attachment.model.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { toObjectId } from "../utils/object-id.js";

function ensureAdmin(group: { admins: unknown[] }, userId: string): void {
  if (!group.admins.some((admin) => String(admin) === userId)) {
    throw new AppError("Group admin permissions required", 403);
  }
}

function attachmentKind(mimeType: string): "image" | "video" | "pdf" | "file" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "file";
}

export const createGroup = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const memberIds = [...new Set([req.user.id, ...((req.body.memberIds as string[]) ?? [])])].map((id) =>
    toObjectId(id, "member id")
  );
  const members = await User.find({ _id: { $in: memberIds }, isActive: true }).select("_id");

  if (members.length !== memberIds.length) {
    throw new AppError("One or more members do not exist", 400);
  }

  const group = await Group.create({
    name: req.body.name,
    description: req.body.description,
    owner: req.user.id,
    admins: [req.user.id],
    members: memberIds,
    permissions: req.body.permissions
  });

  const conversation = await Conversation.create({
    type: "group",
    participants: memberIds,
    group: group._id,
    title: group.name,
    unreadCounts: {}
  });

  res.status(201).json({ group, conversation });
});

export const listGroups = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const groups = await Group.find({ members: req.user.id, isActive: true }).sort({ updatedAt: -1 });
  res.json({ groups });
});

export const searchGroups = asyncHandler(async (req, res) => {
  const { q, limit } = req.query as unknown as { q: string; limit: number };
  const groups = await Group.find(
    { isActive: true, $text: { $search: q } },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit);

  res.json({ groups });
});

export const getGroup = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const group = await Group.findOne({
    _id: toObjectId(req.params.groupId, "group id"),
    members: req.user.id,
    isActive: true
  }).populate("members admins owner", "username displayName avatarUrl presence");

  if (!group) throw new AppError("Group not found", 404);
  res.json({ group });
});

export const updateGroup = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const group = await Group.findOne({ _id: toObjectId(req.params.groupId, "group id"), isActive: true });
  if (!group) throw new AppError("Group not found", 404);
  ensureAdmin(group, req.user.id);

  Object.assign(group, req.body);
  await group.save();
  await Conversation.findOneAndUpdate({ group: group._id }, { $set: { title: group.name } });

  res.json({ group });
});

export const addMember = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const group = await Group.findOne({ _id: toObjectId(req.params.groupId, "group id"), isActive: true });
  if (!group) throw new AppError("Group not found", 404);
  ensureAdmin(group, req.user.id);

  const userId = toObjectId(req.body.userId, "user id");
  const user = await User.findOne({ _id: userId, isActive: true });
  if (!user) throw new AppError("User not found", 404);

  if (!group.members.some((member) => member.toString() === userId.toString())) {
    group.members.push(userId);
    await group.save();
    await Conversation.findOneAndUpdate({ group: group._id }, { $addToSet: { participants: userId } });
  }

  res.json({ group });
});

export const removeMember = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const group = await Group.findOne({ _id: toObjectId(req.params.groupId, "group id"), isActive: true });
  if (!group) throw new AppError("Group not found", 404);
  ensureAdmin(group, req.user.id);

  const userId = toObjectId(req.body.userId, "user id");
  if (group.owner.toString() === userId.toString()) {
    throw new AppError("Cannot remove the group owner", 400);
  }

  group.set("members", group.members.filter((member) => member.toString() !== userId.toString()));
  group.set("admins", group.admins.filter((admin) => admin.toString() !== userId.toString()));
  await group.save();
  await Conversation.findOneAndUpdate({ group: group._id }, { $pull: { participants: userId } });

  res.json({ group });
});

export const promoteAdmin = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const group = await Group.findOne({ _id: toObjectId(req.params.groupId, "group id"), isActive: true });
  if (!group) throw new AppError("Group not found", 404);
  ensureAdmin(group, req.user.id);

  const userId = toObjectId(req.body.userId, "user id");
  if (!group.members.some((member) => member.toString() === userId.toString())) {
    throw new AppError("User must be a group member", 400);
  }

  if (!group.admins.some((admin) => admin.toString() === userId.toString())) {
    group.admins.push(userId);
    await group.save();
  }

  res.json({ group });
});

export const uploadGroupAvatar = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!req.file) throw new AppError("Avatar file is required", 400);

  const group = await Group.findOne({ _id: toObjectId(req.params.groupId, "group id"), isActive: true });
  if (!group) throw new AppError("Group not found", 404);
  ensureAdmin(group, req.user.id);

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

  group.avatarUrl = url;
  await group.save();
  res.json({ group });
});
