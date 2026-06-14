import type { Request, Response, NextFunction } from "express";
import type { ClientRequest, IncomingMessage } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";

import { env } from "../env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import {
  assertAiQuotaAvailable,
  parseRunMetering,
  settleAiUsage,
} from "../services/subscription.js";
import {
  clearThreadRunMetering,
  getLangGraphThreadCheckpointId,
  getLangGraphThreadValues,
} from "../services/langgraph.js";
import { maybeAutoTitleConversation } from "../services/conversation-auto-title.js";
import { applyAgentRunVersion, getAgentContext } from "../services/works.js";

interface StreamSyncContext {
  userId: string;
  workId: string;
  threadId: string;
  conversationId?: string;
}

type StreamSyncRequest = AuthedRequest & {
  youganStreamSync?: StreamSyncContext;
};

function agentProxyPath(req: Request) {
  return req.originalUrl.replace(/^\/agent/, "").split("?")[0] ?? req.path;
}

function parseStreamThreadId(req: Request): string | null {
  const path = agentProxyPath(req);
  const match = path.match(/\/threads\/([^/]+)\/runs\/stream$/);
  return match?.[1] ?? null;
}

function parseStreamSyncContext(req: AuthedRequest): StreamSyncContext | null {
  const threadId = parseStreamThreadId(req);
  if (!threadId) return null;

  const workId = req.headers["x-work-id"];
  if (!workId || typeof workId !== "string" || !req.userId) return null;

  const conversationIdHeader = req.headers["x-conversation-id"];
  const conversationId =
    typeof conversationIdHeader === "string" ? conversationIdHeader : undefined;

  return {
    userId: req.userId,
    workId,
    threadId,
    conversationId,
  };
}

async function readPendingRunMeteringMicroCredits(
  threadId: string | null,
): Promise<number> {
  if (!threadId) return 0;
  try {
    const values = await getLangGraphThreadValues(threadId);
    if (!values || typeof values !== "object") return 0;
    return (
      parseRunMetering(values as Record<string, unknown>)?.microCredits ?? 0
    );
  } catch {
    return 0;
  }
}

/**
 * 在转发 LangGraph run 前注入作品状态；stream 结束后结算 metering 并 append WorkVersion。
 */
export async function injectWorkContext(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const workId = req.headers["x-work-id"];
  const conversationIdHeader = req.headers["x-conversation-id"];
  const conversationId =
    typeof conversationIdHeader === "string" ? conversationIdHeader : undefined;

  if (!workId || typeof workId !== "string" || !req.userId) {
    next();
    return;
  }

  const path = agentProxyPath(req);
  const isStreamRun =
    req.method === "POST" && /\/threads\/([^/]+)\/runs\/stream/.test(path);

  if (!isStreamRun || !req.body || typeof req.body !== "object") {
    next();
    return;
  }

  try {
    const threadId = parseStreamThreadId(req);
    const pendingMicroCredits =
      await readPendingRunMeteringMicroCredits(threadId);
    const usage = await assertAiQuotaAvailable(req.userId, pendingMicroCredits);
    if (!usage.allowed) {
      res.status(402).json({
        error: "AI 创作额度已用完",
        code: "QUOTA_EXCEEDED",
        subscription: usage.summary,
      });
      return;
    }

    const context = await getAgentContext(req.userId, workId, conversationId);
    if (!context) {
      res.status(404).json({ error: "Work not found" });
      return;
    }

    const syncContext = parseStreamSyncContext(req);
    if (syncContext) {
      (req as StreamSyncRequest).youganStreamSync = syncContext;
    }

    const input = (req.body.input ?? req.body) as Record<string, unknown>;
    req.body = {
      ...req.body,
      input: {
        ...input,
        workId: context.workId,
        workTitle: context.workTitle,
        conversationTitle: context.conversationTitle,
        profile: context.profile,
        references: context.references,
        production: context.production,
        usageExceeded: usage.summary.usageExceeded,
      },
    };

    if (conversationId && req.body.config?.configurable) {
      req.body.config.configurable.conversationId = conversationId;
    }

    next();
  } catch {
    next();
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function settleRunMeteringAfterStream(context: StreamSyncContext) {
  try {
    let runMetering = null as ReturnType<typeof parseRunMetering>;
    let values: Record<string, unknown> | null = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      const nextValues = await getLangGraphThreadValues(context.threadId);
      if (nextValues && typeof nextValues === "object") {
        values = nextValues as Record<string, unknown>;
        runMetering = parseRunMetering(values);
        if (runMetering) break;
      }
      if (attempt < 5) await sleep(200);
    }

    if (!runMetering || !values) {
      console.warn(
        "[agent-proxy] skip AI usage settlement: runMetering empty",
        { threadId: context.threadId },
      );
      return;
    }

    const checkpointId =
      (await getLangGraphThreadCheckpointId(context.threadId)) ??
      `${context.threadId}:${runMetering.microCredits}:${runMetering.callCount}`;
    await settleAiUsage(context.userId, {
      microCredits: runMetering.microCredits,
      idempotencyKey: `${context.threadId}:${checkpointId}`,
    });
    await clearThreadRunMetering(context.threadId);
  } catch (error) {
    console.error("[agent-proxy] failed to settle AI usage", error);
  }
}

async function syncWorkAfterStream(
  context: StreamSyncContext,
  statusCode: number,
) {
  if (statusCode < 200 || statusCode >= 300) return;

  await settleRunMeteringAfterStream(context);

  try {
    const values = await getLangGraphThreadValues(context.threadId);
    if (!values || typeof values !== "object") return;
    const record = values as Record<string, unknown>;
    const turn = record.turn as { committed?: boolean } | undefined;
    if (turn?.committed !== true) return;

    try {
      await applyAgentRunVersion({
        userId: context.userId,
        workId: context.workId,
        conversationId: context.conversationId,
        values: record,
      });
    } catch (error) {
      console.error("[agent-proxy] failed to append work version", error);
    }
    try {
      await maybeAutoTitleConversation({
        userId: context.userId,
        workId: context.workId,
        conversationId: context.conversationId,
        values: record,
      });
    } catch (error) {
      console.error("[agent-proxy] failed to auto-title conversation", error);
    }
  } catch (error) {
    console.error("[agent-proxy] failed to read thread state after stream", error);
  }
}

export function createAgentProxy() {
  return createProxyMiddleware({
    target: env.agentUrl,
    changeOrigin: true,
    pathRewrite: { "^/agent": "" },
    on: {
      proxyReq: (proxyReq: ClientRequest, req) => {
        const expressReq = req as Request;
        if (!expressReq.body || typeof expressReq.body !== "object") return;
        const bodyData = JSON.stringify(expressReq.body);
        proxyReq.setHeader("Content-Type", "application/json");
        proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
      },
      proxyRes: (proxyRes: IncomingMessage, req) => {
        const syncContext = (req as StreamSyncRequest).youganStreamSync;
        if (!syncContext) return;

        const statusCode = proxyRes.statusCode ?? 500;
        proxyRes.on("end", () => {
          void syncWorkAfterStream(syncContext, statusCode);
        });
      },
    },
  });
}
