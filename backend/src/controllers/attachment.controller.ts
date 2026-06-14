import { Attachment } from "../models/attachment.model.js";
import { AppError } from "../utils/app-error.js";
import { asyncHandler } from "../utils/async-handler.js";

function attachmentKind(mimeType: string): "image" | "video" | "pdf" | "file" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType === "application/pdf") return "pdf";
  return "file";
}

export const uploadAttachment = asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError("Authentication required", 401);
  if (!req.file) throw new AppError("File is required", 400);

  const attachment = await Attachment.create({
    owner: req.user.id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
    kind: attachmentKind(req.file.mimetype)
  });

  res.status(201).json({ attachment });
});

