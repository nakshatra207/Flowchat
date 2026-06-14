import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { toObjectId } from "../utils/object-id.js";

export const listConversations = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const conversations = await Conversation.find({ participants: req.user.id })
    .populate("participants", "username displayName avatarUrl presence lastSeenAt")
    .populate("group")
    .populate("lastMessage")
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  res.json({ conversations });
});

export const createDirectConversation = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const recipientId = toObjectId(req.body.recipientId, "recipient id");
  const recipient = await User.findOne({ _id: recipientId, isActive: true });

  if (!recipient) {
    throw new AppError("Recipient not found", 404);
  }

  if (recipient.id === req.user.id) {
    throw new AppError("Cannot create a direct conversation with yourself", 400);
  }

  const participantIds = [toObjectId(req.user.id, "user id"), recipientId].sort((a, b) =>
    a.toString().localeCompare(b.toString())
  );
  let conversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: participantIds, $size: 2 }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      type: "direct",
      participants: participantIds,
      unreadCounts: {}
    });
  }

  res.status(201).json({ conversation });
});

export const getConversation = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const conversation = await Conversation.findOne({
    _id: toObjectId(req.params.conversationId, "conversation id"),
    participants: req.user.id
  })
    .populate("participants", "username displayName avatarUrl presence lastSeenAt")
    .populate("group");

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  res.json({ conversation });
});

export const markConversationRead = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const conversation = await Conversation.findOne({
    _id: toObjectId(req.params.conversationId, "conversation id"),
    participants: req.user.id
  });

  if (!conversation) {
    throw new AppError("Conversation not found", 404);
  }

  conversation.unreadCounts.set(req.user.id, 0);
  await conversation.save();

  await Message.updateMany(
    {
      conversation: conversation._id,
      "readBy.user": { $ne: req.user.id }
    },
    {
      $push: {
        readBy: {
          user: req.user.id,
          readAt: new Date()
        }
      }
    }
  );

  res.json({ conversation });
});

