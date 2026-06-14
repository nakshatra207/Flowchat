import type { Types } from "mongoose";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: "user" | "admin" | "moderator";
      tokenVersion: number;
    }

    interface Request {
      user?: User;
      uploadedFileId?: Types.ObjectId;
    }
  }
}

export {};

