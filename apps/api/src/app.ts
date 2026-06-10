import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "./env.js";
import {
  pingRedis,
  connectRedis,
  disconnectRedis,
  isCacheEnabled,
} from "./lib/redis.js";
import { authRouter } from "./routes/auth.js";
import { billingRouter } from "./routes/billing.js";
import { subscriptionRouter } from "./routes/subscription.js";
import { worksRouter } from "./routes/works.js";
import { conversationsRouter } from "./routes/conversations.js";
import { workGroupsRouter } from "./routes/work-groups.js";
import { publicationsRouter } from "./routes/publications.js";
import { usersRouter } from "./routes/users.js";
import { uploadRouter, filesRouter } from "./routes/upload.js";
import { createAgentProxy, injectWorkContext } from "./routes/agent-proxy.js";
import { requireAuth } from "./middleware/auth.js";
import type { AuthedRequest } from "./middleware/auth.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", async (_req, res) => {
    let redis: "disabled" | "ok" | "down" = "disabled";
    if (isCacheEnabled()) {
      redis = (await pingRedis()) ? "ok" : "down";
    }
    res.json({ ok: true, cache: { redis } });
  });

  try {
    const openapi = JSON.parse(
      readFileSync(resolve(root, "openapi/openapi.json"), "utf-8"),
    );
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));
    app.get("/openapi.json", (_req, res) => {
      res.json(openapi);
    });
  } catch {
    app.get("/openapi.json", (_req, res) => {
      res
        .status(503)
        .json({
          error: "OpenAPI spec not generated. Run npm run openapi:generate",
        });
    });
  }

  app.use("/api/auth", authRouter);
  app.use("/api/billing", billingRouter);
  app.use("/api/subscription", subscriptionRouter);
  app.use("/api/work-groups", workGroupsRouter);
  app.use("/api/publications", publicationsRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/works", worksRouter);
  app.use("/api/works/:workId/conversations", conversationsRouter);
  app.use("/api/upload", uploadRouter);
  app.use("/api", filesRouter);

  // LangGraph SDK 兼容代理（需 JWT + X-Work-Id）
  app.use("/langgraph", requireAuth, injectWorkContext, createAgentProxy());

  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}

export async function startServer() {
  await connectRedis();

  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`Yougan API listening on http://localhost:${env.port}`);
    console.log(`OpenAPI docs: http://localhost:${env.port}/docs`);
    console.log(`LangGraph proxy: http://localhost:${env.port}/langgraph`);
    if (isCacheEnabled()) {
      console.log("Redis cache enabled");
    }
  });

  const shutdown = async () => {
    await disconnectRedis();
    server.close();
  };

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}
