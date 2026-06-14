import Joi from "joi";
import { Router } from "express";
import { uploadAttachment } from "../controllers/attachment.controller.js";
import {
  deleteMessage,
  editMessage,
  listMessages,
  markMessageRead,
  reactToMessage,
  searchMessages,
  sendMessage
} from "../controllers/message.controller.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { objectId } from "../validators/common.validators.js";
import {
  editMessageSchema,
  messageParamsSchema,
  messageSearchSchema,
  reactionSchema,
  sendMessageSchema
} from "../validators/message.validators.js";

export const messageRouter = Router();

messageRouter.use(authenticate);
messageRouter.get("/search", validate(messageSearchSchema, "query"), searchMessages);
messageRouter.post("/attachments", upload.single("file"), uploadAttachment);
messageRouter.get(
  "/conversation/:conversationId",
  validate(Joi.object({ conversationId: objectId.required() }), "params"),
  listMessages
);
messageRouter.post("/", validate(sendMessageSchema), sendMessage);
messageRouter.patch("/:messageId", validate(messageParamsSchema, "params"), validate(editMessageSchema), editMessage);
messageRouter.delete("/:messageId", validate(messageParamsSchema, "params"), deleteMessage);
messageRouter.post("/:messageId/reactions", validate(messageParamsSchema, "params"), validate(reactionSchema), reactToMessage);
messageRouter.post("/:messageId/read", validate(messageParamsSchema, "params"), markMessageRead);

