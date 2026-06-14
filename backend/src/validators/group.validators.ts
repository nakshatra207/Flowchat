import Joi from "joi";
import { objectId } from "./common.validators.js";

export const createGroupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().allow("").max(500).default(""),
  memberIds: Joi.array().items(objectId).max(250).default([]),
  permissions: Joi.object({
    onlyAdminsCanMessage: Joi.boolean(),
    onlyAdminsCanInvite: Joi.boolean(),
    onlyAdminsCanEditInfo: Joi.boolean()
  }).default({})
});

export const updateGroupSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100),
  description: Joi.string().allow("").max(500),
  permissions: Joi.object({
    onlyAdminsCanMessage: Joi.boolean(),
    onlyAdminsCanInvite: Joi.boolean(),
    onlyAdminsCanEditInfo: Joi.boolean()
  })
}).min(1);

export const groupParamsSchema = Joi.object({
  groupId: objectId.required()
});

export const groupMemberSchema = Joi.object({
  userId: objectId.required()
});

export const groupSearchSchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required(),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

