import { Router } from "express";
import multer from "multer";
import { z } from "zod";

import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  newUploadFilename,
  readStoredFile,
  uploadFile,
  type UploadFolder,
} from "../services/storage.js";

const IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const PURPOSE_FOLDERS: Record<string, UploadFolder> = {
  reference: "references",
  avatar: "avatars",
  cover: "covers",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadRouter = Router();

uploadRouter.post("/", requireAuth, upload.single("file"), async (req: AuthedRequest, res) => {
  if (!req.file) {
    res.status(400).json({ error: "Missing file" });
    return;
  }

  const purposeParsed = z
    .enum(["reference", "avatar", "cover"])
    .safeParse(req.body?.purpose ?? req.query?.purpose ?? "reference");
  if (!purposeParsed.success) {
    res.status(400).json({ error: "Invalid upload purpose" });
    return;
  }

  const mime = req.file.mimetype || "image/png";
  if (!IMAGE_MIME.has(mime)) {
    res.status(400).json({ error: "仅支持 JPEG、PNG、WebP、GIF 图片" });
    return;
  }

  const folder = PURPOSE_FOLDERS[purposeParsed.data];
  const maxBytes =
    purposeParsed.data === "avatar" ? 3 * 1024 * 1024 : 8 * 1024 * 1024;
  if (req.file.size > maxBytes) {
    res.status(400).json({
      error:
        purposeParsed.data === "avatar"
          ? "头像不能超过 3MB"
          : "图片不能超过 8MB",
    });
    return;
  }

  const filename = newUploadFilename(req.file.originalname);
  const result = await uploadFile(req.file.buffer, folder, filename, mime);
  res.json({ ...result, purpose: purposeParsed.data });
});

export const filesRouter = Router();

filesRouter.get("/files/*key", async (req, res) => {
  const key = (req.params as { key: string[] }).key?.join("/") ?? "";
  try {
    const { buffer, contentType } = await readStoredFile(key);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=31536000");
    res.send(buffer);
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});
