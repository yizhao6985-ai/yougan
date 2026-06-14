import type { ClientRequest } from "node:http";
import type { Request } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

import { env } from "../env.js";

/** 将 C 端 `/api/v1/chat` 转发至 RAG 服务（AG-UI SSE）。 */
export function createRagChatProxy() {
  return createProxyMiddleware({
    target: env.ragServiceUrl,
    changeOrigin: true,
    pathFilter: (pathname) => pathname === "/api/v1/chat",
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
