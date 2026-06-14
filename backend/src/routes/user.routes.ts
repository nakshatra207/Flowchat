import Joi from "joi";
import { Router } from "express";
import { getUserById, searchUsers, updateProfile, uploadAvatar } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { objectId } from "../validators/common.validators.js";
import { updateProfileSchema, userSearchSchema } from "../validators/user.validators.js";

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.get("/search", validate(userSearchSchema, "query"), searchUsers);
userRouter.patch("/me", validate(updateProfileSchema), updateProfile);
userRouter.post("/me/avatar", upload.single("avatar"), uploadAvatar);
userRouter.get("/:userId", validate(Joi.object({ userId: objectId.required() }), "params"), getUserById);

