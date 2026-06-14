import { Schema, model, type InferSchemaType } from "mongoose";

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
      index: true
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      default: null,
      index: true
    },
    title: {
      type: String,
      default: "",
      maxlength: 100
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null
    },
    lastMessageAt: {
      type: Date,
      default: null,
      index: true
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {}
    },
    isArchivedFor: [
      {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    ]
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });
conversationSchema.index({ type: 1, participants: 1 });
conversationSchema.index({ title: "text" });

export type ConversationDocument = InferSchemaType<typeof conversationSchema>;
export const Conversation = model("Conversation", conversationSchema);

