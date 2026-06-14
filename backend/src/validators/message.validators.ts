import Joi from "joi";
import { objectId } from "./common.validators.js";

export const sendMessageSchema = Joi.object({
  conversationId: objectId.required(),
  content: Joi.string().allow("").max(5000).default(""),
  attachmentIds: Joi.array().items(objectId).max(10).default([]),
  replyTo: objectId.allow(null)
});

export const editMessageSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required()
});

export const messageParamsSchema = Joi.object({
  messageId: objectId.required()
});

export const reactionSchema = Joi.object({
  emoji: Joi.string().trim().min(1).max(16).required()
});

export const messageSearchSchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required(),
  conversationId: objectId.optional(),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

