import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { inferMediaKind } from "@yougan/domain";

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

const AUDIO_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
]);

const VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);

const PURPOSE_FOLDERS: Record<string, UploadFolder> = {
  reference: "references",
  avatar: "avatars",
  cover: "covers",
};

const REFERENCE_MAX_BYTES: Record<
  "image" | "audio" | "video" | "text" | "file",
  number
> = {
  image: 8 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 80 * 1024 * 1024,
  text: 8 * 1024 * 1024,
  file: 8 * 1024 * 1024,
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 80 * 1024 * 1024 },
});

function isReferenceMimeAllowed(mime: string): boolean {
  const normalized = mime.trim().toLowerCase();
  const kind = inferMediaKind(mime);
  if (kind === "image") return IMAGE_MIME.has(normalized);
  if (kind === "audio") return AUDIO_MIME.has(normalized);
  if (kind === "video") return VIDEO_MIME.has(normalized);
  if (kind === "text") return normalized.startsWith("text/");
  return false;
}

function referenceMimeError(): string {
  return "参考素材仅支持图片（JPEG/PNG/WebP/GIF）、音频（MP3/WAV/OGG/M4A）、视频（MP4/WebM/MOV）或文本（TXT 等 text/*）";
}

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

  const mime = req.file.mimetype || "application/octet-stream";

  if (purposeParsed.data === "reference") {
    if (!isReferenceMimeAllowed(mime)) {
      res.status(400).json({ error: referenceMimeError() });
      return;
    }
    const kind = inferMediaKind(mime);
    const maxBytes = REFERENCE_MAX_BYTES[kind];
    if (req.file.size > maxBytes) {
      const label =
        kind === "image"
          ? "图片"
          : kind === "audio"
            ? "音频"
            : kind === "video"
              ? "视频"
              : kind === "text"
                ? "文本"
                : "文件";
      res.status(400).json({
        error: `${label}不能超过 ${Math.round(maxBytes / 1024 / 1024)}MB`,
      });
      return;
    }
  } else {
    if (!IMAGE_MIME.has(mime)) {
      res.status(400).json({ error: "仅支持 JPEG、PNG、WebP、GIF 图片" });
      return;
    }
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
  }

  const folder = PURPOSE_FOLDERS[purposeParsed.data];
  const filename = newUploadFilename(req.file.originalname);
  const result = await uploadFile(req.file.buffer, folder, filename, mime);
  res.json({
    purpose: purposeParsed.data,
    asset: {
      key: result.key,
      url: result.url,
      mime_type: mime,
      size_bytes: req.file.size,
      original_name: req.file.originalname,
    },
    url: result.url,
    key: result.key,
  });
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
