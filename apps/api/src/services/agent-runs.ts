import { Client } from "@langchain/langgraph-sdk";

import { env } from "../env.js";
import type { InspirationRecommendation } from "../schemas.js";

const INSPIRATION_RECOMMENDATIONS_ASSISTANT_ID = "inspiration-recommendations";

function readRecommendationsFromRunResult(
  result: unknown,
): InspirationRecommendation[] | null {
  if (!result || typeof result !== "object") return null;

  const record = result as Record<string, unknown>;
  const direct = record.recommendations;
  if (Array.isArray(direct)) {
    return direct as InspirationRecommendation[];
  }

  const values = record.values;
  if (values && typeof values === "object") {
    const nested = (values as Record<string, unknown>).recommendations;
    if (Array.isArray(nested)) {
      return nested as InspirationRecommendation[];
    }
  }

  return null;
}

export async function runInspirationRecommendationsAgent(title: string) {
  const client = new Client({ apiUrl: env.agentUrl });
  const thread = await client.threads.create();
  const result = await client.runs.wait(
    thread.thread_id,
    INSPIRATION_RECOMMENDATIONS_ASSISTANT_ID,
    {
      input: { title: title.trim() || "未命名作品" },
    },
  );

  const recommendations = readRecommendationsFromRunResult(result);
  if (!recommendations?.length) {
    throw new Error("INSPIRATION_RECOMMENDATIONS_EMPTY");
  }

  return recommendations.slice(0, 3);
}
