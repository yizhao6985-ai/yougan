import type { Request, Response, NextFunction } from "express";
import type { ClientRequest, IncomingMessage } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";

import { env } from "../env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { getLangGraphThreadValues } from "../services/langgraph.js";
import { maybeAutoTitleConversation } from "../services/conversation-auto-title.js";
import { applyAgentRunRevision, getAgentContext } from "../services/works.js";
import { consumeAiUsage } from "../services/subscription.js";

interface StreamSyncContext {
  userId: string;
  workId: string;
  threadId: string;
  conversationId?: string;
}

type StreamSyncRequest = AuthedRequest & {
  youganStreamSync?: StreamSyncContext;
};

function langgraphPath(req: Request) {
  return req.originalUrl.replace(/^\/langgraph/, "").split("?")[0] ?? req.path;
}

function parseStreamSyncContext(req: AuthedRequest): StreamSyncContext | null {
  const path = langgraphPath(req);
  const match = path.match(/\/threads\/([^/]+)\/runs\/stream$/);
  if (!match) return null;

  const workId = req.headers["x-work-id"];
  if (!workId || typeof workId !== "string" || !req.userId) return null;

  const conversationIdHeader = req.headers["x-conversation-id"];
  const conversationId =
    typeof conversationIdHeader === "string" ? conversationIdHeader : undefined;

  return {
    userId: req.userId,
    workId,
    threadId: match[1]!,
    conversationId,
  };
}

/**
 * 在转发 LangGraph run 前注入作品状态；stream 结束后 append WorkRevision。
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

  const path = langgraphPath(req);
  const isStreamRun =
    req.method === "POST" && /\/threads\/[^/]+\/runs\/stream/.test(path);

  if (!isStreamRun || !req.body || typeof req.body !== "object") {
    next();
    return;
  }

  try {
    const usage = await consumeAiUsage(req.userId);
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
        outline: context.outline,
        plan: context.plan,
        brief: context.brief,
        draft: context.draft,
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

async function syncWorkAfterStream(
  context: StreamSyncContext,
  statusCode: number,
) {
  if (statusCode < 200 || statusCode >= 300) return;

  try {
    const values = await getLangGraphThreadValues(context.threadId);
    if (!values || typeof values !== "object") return;
    const record = values as Record<string, unknown>;
    try {
      await applyAgentRunRevision({
        userId: context.userId,
        workId: context.workId,
        conversationId: context.conversationId,
        values: record,
      });
    } catch (error) {
      console.error("[agent-proxy] failed to append work revision", error);
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
    pathRewrite: { "^/langgraph": "" },
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
