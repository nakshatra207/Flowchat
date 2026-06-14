import Joi from "joi";

export const updateProfileSchema = Joi.object({
  displayName: Joi.string().trim().min(1).max(80),
  bio: Joi.string().allow("").max(280),
  statusMessage: Joi.string().allow("").max(140),
  presence: Joi.string().valid("online", "offline", "away", "busy")
}).min(1);

export const userSearchSchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required(),
  limit: Joi.number().integer().min(1).max(50).default(20)
});

