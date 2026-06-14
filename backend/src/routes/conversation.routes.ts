import { Router } from "express";
import {
  createDirectConversation,
  getConversation,
  listConversations,
  markConversationRead
} from "../controllers/conversation.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  conversationParamsSchema,
  createDirectConversationSchema
} from "../validators/conversation.validators.js";

export const conversationRouter = Router();

conversationRouter.use(authenticate);
conversationRouter.get("/", listConversations);
conversationRouter.post("/direct", validate(createDirectConversationSchema), createDirectConversation);
conversationRouter.get("/:conversationId", validate(conversationParamsSchema, "params"), getConversation);
conversationRouter.post("/:conversationId/read", validate(conversationParamsSchema, "params"), markConversationRead);

