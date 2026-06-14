import { Schema, model, type InferSchemaType } from "mongoose";

const reactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    emoji: {
      type: String,
      required: true,
      maxlength: 16
    }
  },
  { _id: false, timestamps: true }
);

const readReceiptSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    content: {
      type: String,
      default: "",
      maxlength: 5000
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment"
      }
    ],
    reactions: {
      type: [reactionSchema],
      default: []
    },
    readBy: {
      type: [readReceiptSchema],
      default: []
    },
    editedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null
    }
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, deletedAt: 1 });
messageSchema.index({ content: "text" });

export type MessageDocument = InferSchemaType<typeof messageSchema>;
export const Message = model("Message", messageSchema);

