import { Router } from "express";
import { z } from "zod";

import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import {
  createWork,
  deleteWork,
  getAgentContext,
  getWork,
  listWorks,
  updateWork,
} from "../services/works.js";
import { getWorkInspirationRecommendations } from "../services/inspiration-recommendations.js";
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
  const work = await getWork(req.userId!, req.params.workId);
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
  const work = await updateWork(req.userId!, req.params.workId, body.data);
  if (!work) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.json({ work });
});

worksRouter.delete("/:workId", async (req: AuthedRequest, res) => {
  const ok = await deleteWork(req.userId!, req.params.workId);
  if (!ok) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.status(204).send();
});

worksRouter.get("/:workId/agent-context", async (req: AuthedRequest, res) => {
  const context = await getAgentContext(req.userId!, req.params.workId);
  if (!context) {
    res.status(404).json({ error: "Work not found" });
    return;
  }
  res.json({ context });
});

worksRouter.post(
  "/:workId/inspiration-recommendations",
  async (req: AuthedRequest, res) => {
    try {
      const result = await getWorkInspirationRecommendations(
        req.userId!,
        req.params.workId,
      );
      if (!result) {
        res.status(404).json({ error: "Work not found" });
        return;
      }
      res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "DEEPSEEK_API_KEY_MISSING") {
          res.status(503).json({ error: "灵感推荐服务未配置 DeepSeek" });
          return;
        }
        if (error.message === "INSPIRATION_RECOMMENDATIONS_EMPTY") {
          res.status(502).json({ error: "灵感推荐生成失败" });
          return;
        }
      }
      console.error("[works] inspiration-recommendations failed:", error);
      res.status(502).json({ error: "灵感推荐服务暂不可用" });
    }
  },
);
