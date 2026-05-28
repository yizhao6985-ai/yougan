import { Router } from "express";
import { z } from "zod";

import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createWorkGroup,
  deleteWorkGroup,
  getWorkGroup,
  listWorkGroups,
  updateWorkGroup,
} from "../services/work-groups.js";

export const workGroupsRouter = Router();

workGroupsRouter.use(requireAuth);

workGroupsRouter.get("/", async (req: AuthedRequest, res) => {
  const groups = await listWorkGroups(req.userId!);
  res.json({ groups });
});

workGroupsRouter.post("/", async (req: AuthedRequest, res) => {
  const body = z.object({ title: z.string().optional() }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const group = await createWorkGroup(req.userId!, body.data.title);
  res.status(201).json({ group });
});

workGroupsRouter.get("/:groupId", async (req: AuthedRequest, res) => {
  const group = await getWorkGroup(req.userId!, req.params.groupId);
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.json({ group });
});

workGroupsRouter.patch("/:groupId", async (req: AuthedRequest, res) => {
  const body = z.object({ title: z.string().optional() }).safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const group = await updateWorkGroup(req.userId!, req.params.groupId, body.data);
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.json({ group });
});

workGroupsRouter.delete("/:groupId", async (req: AuthedRequest, res) => {
  const ok = await deleteWorkGroup(req.userId!, req.params.groupId);
  if (!ok) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.status(204).send();
});
