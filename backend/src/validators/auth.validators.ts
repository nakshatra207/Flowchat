import Joi from "joi";

export const registerSchema = Joi.object({
  email: Joi.string().email().max(254).required(),
  username: Joi.string().alphanum().min(3).max(32).required(),
  displayName: Joi.string().trim().min(1).max(80).required(),
  password: Joi.string().min(8).max(128).required()
});

export const loginSchema = Joi.object({
  emailOrUsername: Joi.string().trim().min(3).max(254).required(),
  password: Joi.string().min(8).max(128).required()
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

