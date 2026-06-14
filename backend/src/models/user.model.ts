import { Schema, model, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      match: /^[a-zA-Z0-9_]+$/
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 80
    },
    passwordHash: {
      type: String,
      required: true,
      select: false
    },
    avatarUrl: {
      type: String,
      default: null,
      maxlength: 500
    },
    bio: {
      type: String,
      default: "",
      maxlength: 280
    },
    statusMessage: {
      type: String,
      default: "",
      maxlength: 140
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
      index: true
    },
    presence: {
      type: String,
      enum: ["online", "offline", "away", "busy"],
      default: "offline",
      index: true
    },
    lastSeenAt: {
      type: Date,
      default: null,
      index: true
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false
    },
    tokenVersion: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const obj = ret as Record<string, unknown>;
        delete obj.passwordHash;
        delete obj.refreshTokenHash;
        delete obj.__v;
        return ret;
      }
    }
  }
);

userSchema.index({ displayName: "text", username: "text", email: "text" });
userSchema.index({ createdAt: -1 });

export type UserDocument = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
