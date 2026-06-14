import Joi from "joi";

export const objectId = Joi.string().hex().length(24);

export const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(25),
  q: Joi.string().trim().max(100).optional()
});

