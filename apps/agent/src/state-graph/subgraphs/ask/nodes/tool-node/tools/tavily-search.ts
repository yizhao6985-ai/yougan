/** ask 子图：Tavily 联网搜索 */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { z } from "zod";

import { env } from "#agent/env.js";
import { getActiveTurnKind, getState } from "#agent/state-io/index.js";

type TavilySearchResult = {
  title?: string;
  url?: string;
  content?: string;
};

type TavilySearchResponse = {
  results?: TavilySearchResult[];
  answer?: string;
};

function formatTavilyResults(data: TavilySearchResponse): string {
  const parts: string[] = [];
  if (data.answer?.trim()) {
    parts.push(`摘要：${data.answer.trim()}`);
  }
  const results = data.results ?? [];
  if (!results.length) {
    parts.push("未找到相关结果。");
    return parts.join("\n\n");
  }
  for (const [index, item] of results.entries()) {
    const title = item.title?.trim() || "（无标题）";
    const url = item.url?.trim() || "";
    const content = item.content?.trim() || "";
    parts.push(
      [
        `${index + 1}. ${title}`,
        url ? `链接：${url}` : null,
        content ? content : null,
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  return parts.join("\n\n");
}

export const tavilySearch = tool(
  async ({ query }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";

    if (getActiveTurnKind(getState()) !== "ask") {
      return new ToolMessage({
        content: "tavily_search 仅在提问模式可用。",
        tool_call_id: toolCallId,
      });
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return new ToolMessage({
        content: "搜索关键词不能为空。",
        tool_call_id: toolCallId,
      });
    }

    if (!env.tavilyApiKey) {
      return new ToolMessage({
        content: "Tavily 未配置（缺少 TAVILY_API_KEY），无法联网搜索。",
        tool_call_id: toolCallId,
      });
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: env.tavilyApiKey,
          query: trimmed,
          search_depth: "basic",
          max_results: 5,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        return new ToolMessage({
          content: `Tavily 搜索失败（${response.status}）：${detail.slice(0, 300)}`,
          tool_call_id: toolCallId,
        });
      }

      const data = (await response.json()) as TavilySearchResponse;
      return new ToolMessage({
        content: formatTavilyResults(data),
        tool_call_id: toolCallId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return new ToolMessage({
        content: `Tavily 搜索异常：${message}`,
        tool_call_id: toolCallId,
      });
    }
  },
  {
    name: "tavily_search",
    description:
      "搜索互联网获取实时信息、行业动态、数据事实与背景资料。需要时效性或外部事实时再调用。",
    schema: z.object({
      query: z.string().describe("搜索关键词或完整问句"),
    }),
  },
);
