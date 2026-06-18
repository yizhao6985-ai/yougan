import type { AiUsageSnapshot } from "@yougan/domain";

import {
  getLangGraphThreadCheckpointId,
  getLangGraphThreadValues,
  patchThreadValues,
} from "./langgraph.js";
import { getAiUsageSnapshot, settleAiUsage } from "./subscription.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCheckpointSettled(
  values: Record<string, unknown>,
): number | null {
  const aiUsage = values.aiUsage;
  if (!aiUsage || typeof aiUsage !== "object") return null;
  const settled = (aiUsage as AiUsageSnapshot).settledMicroCredits;
  if (typeof settled !== "number" || !Number.isFinite(settled)) return null;
  return Math.max(0, settled);
}

/**
 * Agent 调用结束或取消后：checkpoint.settledMicroCredits 与 DB 对齐入账。
 */
export async function syncThreadAiUsageAfterRun(
  userId: string,
  threadId: string,
): Promise<AiUsageSnapshot | null> {
  let checkpointSettled: number | null = null;
  let checkpointId: string | null = null;

  for (let attempt = 0; attempt < 6; attempt++) {
    const values = await getLangGraphThreadValues(threadId);
    if (values && typeof values === "object") {
      checkpointSettled = parseCheckpointSettled(
        values as Record<string, unknown>,
      );
      checkpointId = await getLangGraphThreadCheckpointId(threadId);
      if (checkpointSettled != null) break;
    }
    if (attempt < 5) await sleep(200);
  }

  if (checkpointSettled == null) {
    return null;
  }

  const dbBefore = await getAiUsageSnapshot(userId);
  const delta = checkpointSettled - dbBefore.settledMicroCredits;
  if (delta <= 0) {
    return null;
  }

  const idempotencyKey =
    checkpointId ??
    `${threadId}:${checkpointSettled}:${dbBefore.settledMicroCredits}`;

  await settleAiUsage(userId, {
    microCredits: delta,
    idempotencyKey: `${threadId}:${idempotencyKey}`,
  });

  const aiUsage = await getAiUsageSnapshot(userId);

  try {
    await patchThreadValues(threadId, { aiUsage });
  } catch (error) {
    console.error("[ai-usage-sync] failed to patch thread aiUsage", error);
  }

  return aiUsage;
}
