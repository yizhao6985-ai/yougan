import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import {
  buildCollectRevisionHumanPrompt,
  buildCollectRevisionSystemPrompt,
} from "./prompt.js";
import type { RunnableConfig } from "@langchain/core/runnables";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  appendRevisionIntent,
  normalizeRevisionQuote,
  PREVIEW_BODY_BLOCK_ID,
  previewPlainText,
} from "@yougan/domain";
import {
  getLatestHumanMessageId,
  getLatestHumanMessagePreviewSelections,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import {
  patchPendingRevision,
  getPreview,
  getRevision,
} from "#agent/state-io/index.js";
import {
  COLLECT_REVISION_SUBJECT,
  collectRevisionActivityId,
  upsertTurnActivity,
} from "#agent/state-io/turn-activities.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import {
  CollectRevisionSchema,
  type CollectRevisionOutput,
} from "./schema.js";

function findAnchorBlockId(
  previewText: string,
  quote: string | null | undefined,
  state: AgentStateType,
): { blockId: string; quote: string } | null {
  const trimmed = quote?.trim();
  if (!trimmed) return null;
  const text = previewText || previewPlainText(getPreview(state));
  if (!text.includes(trimmed)) return null;
  return { blockId: PREVIEW_BODY_BLOCK_ID, quote: trimmed };
}

function doneCollectRevisionActivity(
  state: AgentStateType,
): AgentStatePatch {
  const humanMessageId = getLatestHumanMessageId(state.messages);
  if (!humanMessageId) return {};
  return upsertTurnActivity({
    id: collectRevisionActivityId(humanMessageId),
    refId: humanMessageId,
    kind: "collect_revision",
    status: "done",
    subject: COLLECT_REVISION_SUBJECT,
  });
}

export async function collectRevisionNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const userMessage = getLatestHumanMessageText(state.messages)?.trim();
  if (!userMessage) return {};

  const previewSelections = getLatestHumanMessagePreviewSelections(
    state.messages,
  );
  if (previewSelections.length > 0) {
    let revision = getRevision(state);
    for (const selection of previewSelections) {
      revision = appendRevisionIntent(revision, {
        instruction: userMessage,
        anchor: {
          blockId: selection.blockId,
          quote: selection.quote,
        },
        source: "selection",
      });
    }
    return {
      ...patchPendingRevision(state, revision),
      ...doneCollectRevisionActivity(state),
      ...patchAiUsageMetering(state.aiUsage, config),
    };
  }

  const preview = getPreview(state);
  const previewText = previewPlainText(preview, 4000);

  const llm = createChatModel({ temperature: 0.2 });
  let parsed: CollectRevisionOutput;
  try {
    parsed = (await invokeStructured(
      llm,
      CollectRevisionSchema,
      [
        new SystemMessage(buildCollectRevisionSystemPrompt()),
        new HumanMessage(
          buildCollectRevisionHumanPrompt({
            previewText,
            userMessage,
          }),
        ),
      ],
      { name: "collect_revision" },
      config,
    )) as CollectRevisionOutput;
  } catch {
    parsed = { instruction: userMessage, quote: null };
  }

  const normalizedQuote = normalizeRevisionQuote(parsed.quote);
  const anchorMatch = findAnchorBlockId(previewText, normalizedQuote, state);
  const revision = appendRevisionIntent(getRevision(state), {
    instruction: parsed.instruction.trim() || userMessage,
    anchor: anchorMatch
      ? {
          blockId: anchorMatch.blockId,
          quote: anchorMatch.quote,
        }
      : normalizedQuote
        ? { blockId: "unknown", quote: normalizedQuote }
        : null,
    source: "chat",
  });

  return {
    ...patchPendingRevision(state, revision),
    ...doneCollectRevisionActivity(state),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
