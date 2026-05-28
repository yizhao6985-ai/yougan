/**
 * 新建作品时的灵感推荐（独立 LangGraph，非三模式主流程）。
 * DeepSeek structured output → 1–3 条可点击开场白。
 */
import { HumanMessage } from "@langchain/core/messages";
import { nanoid } from "nanoid";

import { createDeepSeekModel } from "../../llm/deepseek.js";
import { invokeStructuredOutput } from "../../lib/structured-output.js";
import { buildInspirationRecommendationsPrompt } from "./prompts.js";
import {
  InspirationRecommendationsResponseSchema,
  type InspirationRecommendation,
} from "./schema.js";

export type { InspirationRecommendation } from "./schema.js";

function fallbackRecommendations(title: string): InspirationRecommendation[] {
  const base = title.trim() || "这件作品";
  return [
    {
      id: nanoid(),
      suggestion: `想围绕「${base}」写内容，先帮我梳理适合的角度和目标读者`,
    },
    {
      id: nanoid(),
      suggestion: `有「${base}」这个方向，想先帮我定平台和内容结构`,
    },
    {
      id: nanoid(),
      suggestion: `打算做一篇关于「${base}」的分享，但还不确定从哪个切入点展开`,
    },
  ];
}

export async function generateInspirationRecommendationsWithDeepSeek(
  title: string,
): Promise<InspirationRecommendation[]> {
  const trimmedTitle = title.trim() || "未命名作品";
  const llm = createDeepSeekModel({ temperature: 0.7 });
  const prompt = buildInspirationRecommendationsPrompt(trimmedTitle);

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      InspirationRecommendationsResponseSchema,
      [new HumanMessage(prompt)],
      { name: "inspiration_recommendations" },
    );
    return parsed.recommendations.map((recommendation) => ({
      ...recommendation,
      id: nanoid(),
    }));
  } catch {
    return fallbackRecommendations(trimmedTitle);
  }
}
