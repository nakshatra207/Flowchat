import { Router } from "express";
import {
  addMember,
  createGroup,
  getGroup,
  listGroups,
  promoteAdmin,
  removeMember,
  searchGroups,
  updateGroup,
  uploadGroupAvatar
} from "../controllers/group.controller.js";
import { authenticate } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import {
  createGroupSchema,
  groupMemberSchema,
  groupParamsSchema,
  groupSearchSchema,
  updateGroupSchema
} from "../validators/group.validators.js";

export const groupRouter = Router();

groupRouter.use(authenticate);
groupRouter.get("/", listGroups);
groupRouter.get("/search", validate(groupSearchSchema, "query"), searchGroups);
groupRouter.post("/", validate(createGroupSchema), createGroup);
groupRouter.get("/:groupId", validate(groupParamsSchema, "params"), getGroup);
groupRouter.patch("/:groupId", validate(groupParamsSchema, "params"), validate(updateGroupSchema), updateGroup);
groupRouter.post("/:groupId/avatar", validate(groupParamsSchema, "params"), upload.single("avatar"), uploadGroupAvatar);
groupRouter.post("/:groupId/members", validate(groupParamsSchema, "params"), validate(groupMemberSchema), addMember);
groupRouter.delete("/:groupId/members", validate(groupParamsSchema, "params"), validate(groupMemberSchema), removeMember);
groupRouter.post("/:groupId/admins", validate(groupParamsSchema, "params"), validate(groupMemberSchema), promoteAdmin);

