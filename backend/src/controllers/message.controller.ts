import { Attachment } from "../models/attachment.model.js";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { Notification } from "../models/notification.model.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { toObjectId } from "../utils/object-id.js";

export const listMessages = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const conversationId = toObjectId(req.params.conversationId, "conversation id");
  const conversation = await Conversation.findOne({ _id: conversationId, participants: req.user.id });

  if (!conversation) throw new AppError("Conversation not found", 404);

  const limit = Math.min(Number(req.query.limit ?? 50), 100);
  const messages = await Message.find({ conversation: conversationId, deletedAt: null })
    .populate("sender", "username displayName avatarUrl")
    .populate("attachments")
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({ messages: messages.reverse() });
});

export const sendMessage = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const conversationId = toObjectId(req.body.conversationId, "conversation id");
  const conversation = await Conversation.findOne({ _id: conversationId, participants: req.user.id });

  if (!conversation) throw new AppError("Conversation not found", 404);

  const attachmentIds = (req.body.attachmentIds as string[]).map((id) => toObjectId(id, "attachment id"));
  if (!req.body.content && attachmentIds.length === 0) {
    throw new AppError("Message content or attachment is required", 400);
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: req.user.id,
    content: req.body.content,
    attachments: attachmentIds,
    replyTo: req.body.replyTo ? toObjectId(req.body.replyTo, "reply message id") : null,
    readBy: [{ user: req.user.id, readAt: new Date() }]
  });

  await Attachment.updateMany(
    { _id: { $in: attachmentIds }, owner: req.user.id },
    { $set: { message: message._id } }
  );

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  for (const participant of conversation.participants) {
    const participantId = participant.toString();
    if (participantId !== req.user.id) {
      conversation.unreadCounts.set(participantId, (conversation.unreadCounts.get(participantId) ?? 0) + 1);
      await Notification.create({
        recipient: participant,
        actor: req.user.id,
        conversation: conversation._id,
        message: message._id,
        type: "message",
        title: "New message",
        body: req.body.content || "Sent an attachment"
      });
    }
  }
  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "username displayName avatarUrl")
    .populate("attachments");

  res.status(201).json({ message: populatedMessage });
});

export const editMessage = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const message = await Message.findOneAndUpdate(
    { _id: toObjectId(req.params.messageId, "message id"), sender: req.user.id, deletedAt: null },
    { $set: { content: req.body.content, editedAt: new Date() } },
    { new: true }
  );

  if (!message) throw new AppError("Message not found", 404);
  res.json({ message });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const message = await Message.findOneAndUpdate(
    { _id: toObjectId(req.params.messageId, "message id"), sender: req.user.id, deletedAt: null },
    { $set: { deletedAt: new Date(), content: "", attachments: [] } },
    { new: true }
  );

  if (!message) throw new AppError("Message not found", 404);
  res.json({ message });
});

export const reactToMessage = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const message = await Message.findOne({
    _id: toObjectId(req.params.messageId, "message id"),
    deletedAt: null
  });

  if (!message) throw new AppError("Message not found", 404);

  message.set(
    "reactions",
    message.reactions.filter((reaction) => reaction.user.toString() !== req.user?.id)
  );
  message.reactions.push({ user: toObjectId(req.user.id, "user id"), emoji: req.body.emoji });
  await message.save();

  res.json({ message });
});

export const markMessageRead = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const message = await Message.findOneAndUpdate(
    {
      _id: toObjectId(req.params.messageId, "message id"),
      "readBy.user": { $ne: req.user.id }
    },
    {
      $push: {
        readBy: {
          user: req.user.id,
          readAt: new Date()
        }
      }
    },
    { new: true }
  );

  if (!message) throw new AppError("Message not found or already read", 404);
  res.json({ message });
});

export const searchMessages = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);

  const { q, conversationId, limit } = req.query as unknown as {
    q: string;
    conversationId?: string;
    limit: number;
  };
  const conversations = await Conversation.find({ participants: req.user.id }).select("_id");
  const allowedIds = conversations.map((conversation) => conversation._id);
  const queryConversationIds = conversationId ? [toObjectId(conversationId, "conversation id")] : allowedIds;

  const messages = await Message.find(
    {
      conversation: { $in: queryConversationIds },
      deletedAt: null,
      $text: { $search: q }
    },
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .limit(limit)
    .populate("sender", "username displayName avatarUrl");

  res.json({ messages });
});
