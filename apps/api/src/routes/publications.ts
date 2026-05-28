import { Router } from "express";
import { z } from "zod";

import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  DISCOVER_FORMATS,
  DISCOVER_MEDIA_TYPES,
  DISCOVER_PLATFORMS,
  DISCOVER_TOPIC_CATEGORIES,
} from "../lib/discover-taxonomy.js";
import { PublicationStatusSchema } from "../schemas.js";
import {
  createPublicationFromWork,
  deletePublication,
  getPublicationBySlug,
  listPublicationFeed,
  listUserPublications,
  recordPublicationView,
  updatePublicationStatus,
} from "../services/publications.js";

export const publicationsRouter = Router();

const formatIds = DISCOVER_FORMATS.map((item) => item.id);
const topicIds = DISCOVER_TOPIC_CATEGORIES.map((item) => item.id);
const mediaIds = DISCOVER_MEDIA_TYPES.map((item) => item.id);
const platformIds = DISCOVER_PLATFORMS.map((item) => item.id);

const FeedQuerySchema = z.object({
  platform: z.enum(platformIds as [string, ...string[]]).optional(),
  contentFormat: z.enum(formatIds as [string, ...string[]]).optional(),
  topicCategory: z.enum(topicIds as [string, ...string[]]).optional(),
  mediaType: z.enum(mediaIds as [string, ...string[]]).optional(),
  limit: z.coerce.number().int().min(1).max(60).optional(),
});

publicationsRouter.get("/feed", async (req, res) => {
  const parsed = FeedQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid filter query" });
    return;
  }

  const result = await listPublicationFeed(parsed.data);
  res.json(result);
});

publicationsRouter.get("/slug/:slug", async (req, res) => {
  const publication = await getPublicationBySlug(req.params.slug);
  if (!publication) {
    res.status(404).json({ error: "Content not found" });
    return;
  }
  void recordPublicationView(publication.id).catch((err) => {
    console.error("[publications] Failed to record view:", err);
  });
  res.json({ publication });
});

publicationsRouter.get("/mine", requireAuth, async (req: AuthedRequest, res) => {
  const publications = await listUserPublications(req.userId!);
  res.json({ publications });
});

publicationsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const body = z
    .object({
      workId: z.string(),
      publish: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const publication = await createPublicationFromWork(req.userId!, body.data);
    if (!publication) {
      res.status(404).json({ error: "Work not found" });
      return;
    }
    res.status(201).json({ publication });
  } catch (error) {
    if (error instanceof Error && error.message === "WORK_OUTPUT_EMPTY") {
      res.status(400).json({ error: "作品还没有可发布的成稿内容" });
      return;
    }
    res.status(500).json({ error: "Publish failed" });
  }
});

publicationsRouter.patch(
  "/:publicationId",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const body = z
      .object({ status: PublicationStatusSchema })
      .safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const publication = await updatePublicationStatus(
      req.userId!,
      req.params.publicationId,
      body.data.status,
    );
    if (!publication) {
      res.status(404).json({ error: "Publication not found" });
      return;
    }
    res.json({ publication });
  },
);

publicationsRouter.delete(
  "/:publicationId",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const ok = await deletePublication(req.userId!, req.params.publicationId);
    if (!ok) {
      res.status(404).json({ error: "Publication not found" });
      return;
    }
    res.status(204).send();
  },
);
