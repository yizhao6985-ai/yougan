import { Router } from "express";
import { z } from "zod";

import { routeParam } from "../lib/route-params.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createWorkConversation,
  deleteWorkConversation,
  listWorkConversations,
  updateWorkConversation,
} from "../services/conversations.js";
import { SyncWorkConversationSchema } from "../schemas.js";

export const conversationsRouter = Router({ mergeParams: true });

conversationsRouter.use(requireAuth);

conversationsRouter.get("/", async (req: AuthedRequest, res) => {
  const workId = routeParam(req.params.workId, "workId");
  const conversations = await listWorkConversations(req.userId!, workId);
  if (!conversations) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.json({ conversations });
});

conversationsRouter.post("/", async (req: AuthedRequest, res) => {
  const workId = routeParam(req.params.workId, "workId");
  const body = z
    .object({
      title: z.string().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const conversation = await createWorkConversation(
    req.userId!,
    workId,
    body.data,
  );
  if (!conversation) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.status(201).json({ conversation });
});

conversationsRouter.patch("/:conversationId", async (req: AuthedRequest, res) => {
  const workId = routeParam(req.params.workId, "workId");
  const conversationId = routeParam(req.params.conversationId, "conversationId");
  const body = SyncWorkConversationSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const conversation = await updateWorkConversation(
    req.userId!,
    workId,
    conversationId,
    body.data,
  );
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.json({ conversation });
});

conversationsRouter.delete("/:conversationId", async (req: AuthedRequest, res) => {
  const workId = routeParam(req.params.workId, "workId");
  const conversationId = routeParam(req.params.conversationId, "conversationId");
  const ok = await deleteWorkConversation(req.userId!, workId, conversationId);
  if (!ok) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.status(204).send();
});
