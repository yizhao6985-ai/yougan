import type { Request, Response, NextFunction } from "express";
import type { ClientRequest } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";

import { env } from "../env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { getAgentContext, updateWork } from "../services/works.js";
import { consumeAiUsage } from "../services/subscription.js";

function langgraphPath(req: Request) {
  return req.originalUrl.replace(/^\/langgraph/, "").split("?")[0] ?? req.path;
}

/**
 * 在转发 LangGraph run 前，从 X-Work-Id / X-Conversation-Id 注入作品长记忆与对话模式。
 * 流结束后由前端 PATCH 同步：作品 JSON 字段 → Work，threadId/mode → WorkConversation。
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

    const input = (req.body.input ?? req.body) as Record<string, unknown>;
    req.body = {
      ...req.body,
      input: {
        ...input,
        mode: context.mode,
        workId: context.workId,
        profile: context.profile,
        plan: context.outline,
        inspiration: context.inspiration,
        creation: context.creation,
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
    },
  });
}

export async function syncWorkFromAgentState(
  userId: string,
  workId: string,
  values: Record<string, unknown>,
) {
  return updateWork(userId, workId, {
    profile: values.profile,
    outline: values.plan ?? values.outline,
    inspiration: values.inspiration,
    creation: values.creation ?? null,
  });
}
