import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { verifyAccessToken } from "../services/token.service.js";
import { Message } from "../models/message.model.js";
import { Conversation } from "../models/conversation.model.js";

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const payload = verifyAccessToken(token);
      socket.data.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.user?.id;
    logger.info("Socket connected", { socketId: socket.id, userId });

    socket.on("user-online", ({ userId }: { userId: string }) => {
      socket.broadcast.emit("user-online", { userId });
    });

    socket.on("join-room", (roomId: string) => {
      socket.join(roomId);
    });

    socket.on("leave-room", (roomId: string) => {
      socket.leave(roomId);
    });

    socket.on("typing-start", ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.to(roomId).emit("typing-start", { roomId, userId });
    });

    socket.on("typing-stop", ({ roomId, userId }: { roomId: string; userId: string }) => {
      socket.to(roomId).emit("typing-stop", { roomId, userId });
    });

    socket.on("send-message", async ({ messageId, roomId }: { messageId: string; roomId: string }) => {
      const message = await Message.findById(messageId)
        .populate("sender", "username displayName avatarUrl")
        .populate("attachments");

      if (message) {
        await Conversation.findByIdAndUpdate(message.conversation, {
          $set: {
            lastMessage: message._id,
            lastMessageAt: message.createdAt
          }
        });
        io.to(roomId).emit("receive-message", { message });
      }
    });

    socket.on("message-read", ({ roomId, messageId, userId }) => {
      socket.to(roomId).emit("message-read", { roomId, messageId, userId });
    });

    socket.on("user-offline", ({ userId }: { userId: string }) => {
      socket.broadcast.emit("user-offline", { userId });
    });

    socket.on("disconnect", () => {
      logger.info("Socket disconnected", { socketId: socket.id, userId });
    });
  });

  return io;
}
