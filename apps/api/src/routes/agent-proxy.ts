import type { Request, Response, NextFunction } from "express";
import type { ClientRequest, IncomingMessage, ServerResponse } from "node:http";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { AiUsageSnapshot } from "@yougan/domain";

import { env } from "../env.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { syncThreadAiUsageAfterRun } from "../services/ai-usage-sync.js";
import { assertAiQuotaAvailable } from "../services/subscription.js";
import { getLangGraphThreadValues } from "../services/langgraph.js";
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

function parseThreadIdFromAgentPath(path: string): string | null {
  const match = path.match(/\/threads\/([^/]+)/);
  return match?.[1] ?? null;
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

function isStateUpdateRequest(req: Request): boolean {
  return (
    req.method === "POST" &&
    /\/threads\/[^/]+\/state$/.test(agentProxyPath(req))
  );
}

/** stream 结束后异步结算；updateState 在响应体内同步结算并注入 aiUsage */
function shouldSyncAiUsageAfterStream(req: Request): boolean {
  if (req.method !== "POST") return false;
  return /\/runs\/stream$/.test(agentProxyPath(req));
}

function injectAiUsageIntoStateResponse(
  raw: Buffer,
  aiUsage: AiUsageSnapshot,
): Buffer {
  try {
    const json = JSON.parse(raw.toString("utf8")) as Record<string, unknown>;
    if (json.values && typeof json.values === "object") {
      (json.values as Record<string, unknown>).aiUsage = aiUsage;
    }
    json.aiUsage = aiUsage;
    return Buffer.from(JSON.stringify(json));
  } catch {
    return raw;
  }
}

function writeProxyHeaders(
  res: ServerResponse,
  proxyRes: IncomingMessage,
  statusCode: number,
) {
  res.statusCode = statusCode;
  for (const [key, value] of Object.entries(proxyRes.headers)) {
    if (value === undefined) continue;
    const lower = key.toLowerCase();
    if (lower === "transfer-encoding" || lower === "content-length") continue;
    if (Array.isArray(value)) {
      res.setHeader(key, value);
    } else {
      res.setHeader(key, value);
    }
  }
}

function endProxyResponse(
  res: ServerResponse,
  proxyRes: IncomingMessage,
  statusCode: number,
  body?: Buffer,
) {
  writeProxyHeaders(res, proxyRes, statusCode);
  if (body) {
    res.setHeader("Content-Length", body.length);
    res.end(body);
    return;
  }
  res.end();
}

async function syncAiUsageIfNeeded(req: AuthedRequest) {
  if (!req.userId || !shouldSyncAiUsageAfterStream(req)) return;
  const threadId = parseThreadIdFromAgentPath(agentProxyPath(req));
  if (!threadId) return;
  try {
    await syncThreadAiUsageAfterRun(req.userId, threadId);
  } catch (error) {
    console.error("[agent-proxy] failed to sync ai usage", error);
  }
}

/**
 * LangGraph stream 开始前：额度门禁 + 注入作品上下文与 aiUsage。
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
    const usage = await assertAiQuotaAvailable(req.userId);
    if (!usage.allowed) {
      res.status(402).json({
        error: "AI 创作额度已用完",
        code: "QUOTA_EXCEEDED",
        subscription: usage.summary,
        aiUsage: usage.aiUsage,
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
        aiUsage: usage.aiUsage,
      },
    };

    req.body.config ??= {};
    req.body.config.configurable ??= {};
    req.body.config.configurable.userId = req.userId;
    if (conversationId) {
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
    selfHandleResponse: true,
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
      proxyRes: (proxyRes: IncomingMessage, req, res) => {
        const expressReq = req as StreamSyncRequest;
        const expressRes = res as ServerResponse;
        const statusCode = proxyRes.statusCode ?? 500;
        const settleStateInResponse =
          isStateUpdateRequest(expressReq) && Boolean(expressReq.userId);

        if (settleStateInResponse) {
          const chunks: Buffer[] = [];
          proxyRes.on("data", (chunk: Buffer) => chunks.push(chunk));
          proxyRes.on("end", () => {
            void (async () => {
              let body = Buffer.concat(chunks);
              const threadId = parseThreadIdFromAgentPath(
                agentProxyPath(expressReq),
              );

              if (
                statusCode >= 200 &&
                statusCode < 300 &&
                threadId &&
                expressReq.userId
              ) {
                try {
                  const aiUsage = await syncThreadAiUsageAfterRun(
                    expressReq.userId,
                    threadId,
                  );
                  if (aiUsage) {
                    body = injectAiUsageIntoStateResponse(body, aiUsage);
                  }
                } catch (error) {
                  console.error(
                    "[agent-proxy] failed to sync ai usage on state",
                    error,
                  );
                }
              }

              endProxyResponse(expressRes, proxyRes, statusCode, body);
            })();
          });
          return;
        }

        writeProxyHeaders(expressRes, proxyRes, statusCode);
        proxyRes.pipe(expressRes);
        proxyRes.on("end", () => {
          void syncAiUsageIfNeeded(expressReq);

          const syncContext = expressReq.youganStreamSync;
          if (!syncContext) return;
          void syncWorkAfterStream(syncContext, statusCode);
        });
      },
    },
  });
}
