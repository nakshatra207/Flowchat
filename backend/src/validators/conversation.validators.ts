import Joi from "joi";
import { objectId } from "./common.validators.js";

export const createDirectConversationSchema = Joi.object({
  recipientId: objectId.required()
});

export const conversationParamsSchema = Joi.object({
  conversationId: objectId.required()
});

