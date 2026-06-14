import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { conversationRouter } from "./conversation.routes.js";
import { groupRouter } from "./group.routes.js";
import { healthRouter } from "./health.routes.js";
import { messageRouter } from "./message.routes.js";
import { notificationRouter } from "./notification.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/conversations", conversationRouter);
apiRouter.use("/messages", messageRouter);
apiRouter.use("/groups", groupRouter);
apiRouter.use("/notifications", notificationRouter);
