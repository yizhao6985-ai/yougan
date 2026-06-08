import { Router } from "express";
import { z } from "zod";

import { routeParam } from "../lib/route-params.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createWork,
  deleteWork,
  duplicateWork,
  getAgentContext,
  getWork,
  listWorks,
  updateWork,
} from "../services/works.js";
import {
  listWorkVersions,
  restoreWorkToVersion,
} from "../services/work-versions.js";
import { SyncWorkStateSchema } from "../schemas.js";

export const worksRouter = Router();

worksRouter.use(requireAuth);

worksRouter.get("/", async (req: AuthedRequest, res) => {
  const works = await listWorks(req.userId!);
  res.json({ works });
});

worksRouter.post("/", async (req: AuthedRequest, res) => {
  const body = z
    .object({
      title: z.string().optional(),
      groupId: z.string().nullable().optional(),
    })
    .safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const work = await createWork(
      req.userId!,
      body.data.title,
      body.data.groupId,
    );
    res.status(201).json({ work });
  } catch {
    res.status(404).json({ error: "Group not found" });
  }
});

worksRouter.get("/:workId", async (req: AuthedRequest, res) => {
  const work = await getWork(req.userId!, routeParam(req.params.workId, "workId"));
  if (!work) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.json({ work });
});

worksRouter.patch("/:workId", async (req: AuthedRequest, res) => {
  const body = SyncWorkStateSchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const conversationId =
    typeof req.query.conversationId === "string"
      ? req.query.conversationId
      : undefined;
  const work = await updateWork(
    req.userId!,
    routeParam(req.params.workId, "workId"),
    body.data,
    { conversationId },
  );
  if (!work) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.json({ work });
});

worksRouter.delete("/:workId", async (req: AuthedRequest, res) => {
  const ok = await deleteWork(req.userId!, routeParam(req.params.workId, "workId"));
  if (!ok) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.status(204).send();
});

worksRouter.get("/:workId/agent-context", async (req: AuthedRequest, res) => {
  const conversationId =
    typeof req.query.conversationId === "string"
      ? req.query.conversationId
      : undefined;
  const context = await getAgentContext(
    req.userId!,
    routeParam(req.params.workId, "workId"),
    conversationId,
  );
  if (!context) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.json({ context });
});

worksRouter.get("/:workId/versions", async (req: AuthedRequest, res) => {
  const versions = await listWorkVersions(
    req.userId!,
    routeParam(req.params.workId, "workId"),
  );
  if (!versions) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.json({ versions });
});

worksRouter.post(
  "/:workId/restore/:versionId",
  async (req: AuthedRequest, res) => {
    const version = await restoreWorkToVersion(
      req.userId!,
      routeParam(req.params.workId, "workId"),
      routeParam(req.params.versionId, "versionId"),
    );
    if (!version) {
      res.status(404).json({ error: "Version not found" });
      return;
    }
    const work = await getWork(
      req.userId!,
      routeParam(req.params.workId, "workId"),
    );
    res.json({ version, work });
  },
);

worksRouter.post("/:workId/duplicate", async (req: AuthedRequest, res) => {
  const body = z
    .object({
      title: z.string().optional(),
      groupId: z.string().nullable().optional(),
      versionId: z.string().optional(),
    })
    .safeParse(req.body ?? {});
  if (!body.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const work = await duplicateWork(
    req.userId!,
    routeParam(req.params.workId, "workId"),
    body.data,
  );
  if (!work) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.status(201).json({ work });
});
