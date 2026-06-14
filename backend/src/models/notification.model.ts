import { Schema, model, type InferSchemaType } from "mongoose";

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      default: null
    },
    message: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },
    type: {
      type: String,
      enum: ["message", "mention", "reaction", "group_invite", "system"],
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 120
    },
    body: {
      type: String,
      default: "",
      maxlength: 500
    },
    readAt: {
      type: Date,
      default: null,
      index: true
    }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const Notification = model("Notification", notificationSchema);

