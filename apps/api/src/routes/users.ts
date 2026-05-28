import { Router } from "express";
import { z } from "zod";

import { listUserPublishedPublications } from "../services/publications.js";
import { getPublicUserProfile, getUserProfileStats } from "../services/users.js";

export const usersRouter = Router();

const PublicationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(60).optional(),
});

usersRouter.get("/:userId", async (req, res) => {
  const profile = await getPublicUserProfile(req.params.userId);
  if (!profile) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: profile });
});

usersRouter.get("/:userId/stats", async (req, res) => {
  const stats = await getUserProfileStats(req.params.userId);
  if (!stats) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ stats });
});

usersRouter.get("/:userId/publications", async (req, res) => {
  const parsed = PublicationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const publications = await listUserPublishedPublications(
    req.params.userId,
    parsed.data.limit,
  );
  if (publications === null) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ publications });
});
