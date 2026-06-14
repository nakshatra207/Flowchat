import { Schema, model, type InferSchemaType } from "mongoose";

const attachmentSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    message: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
      index: true
    },
    originalName: {
      type: String,
      required: true,
      maxlength: 255
    },
    storedName: {
      type: String,
      required: true,
      maxlength: 255
    },
    mimeType: {
      type: String,
      required: true,
      maxlength: 120
    },
    size: {
      type: Number,
      required: true,
      min: 1
    },
    url: {
      type: String,
      required: true,
      maxlength: 500
    },
    kind: {
      type: String,
      enum: ["image", "video", "pdf", "file"],
      required: true,
      index: true
    }
  },
  { timestamps: true }
);

attachmentSchema.index({ owner: 1, createdAt: -1 });
attachmentSchema.index({ originalName: "text", mimeType: "text" });

export type AttachmentDocument = InferSchemaType<typeof attachmentSchema>;
export const Attachment = model("Attachment", attachmentSchema);

