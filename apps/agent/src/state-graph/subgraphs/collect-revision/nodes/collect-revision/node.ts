import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { patchAiUsageMetering } from "#agent/llm/invoke/metering.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  appendRevisionIntent,
  previewPlainText,
  previewContentToLegacyBlocks,
} from "@yougan/domain";
import { getLatestHumanMessagePreviewSelections, getLatestHumanMessageText } from "#agent/messages/human.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import {
  patchPendingRevision,
  getPreview,
  getRevision,
} from "#agent/state-io/index.js";
import { patchRunProgress, buildRunProgress } from "#agent/state-io/run-progress.js";
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
  const preview = getPreview(state);
  const blocks = preview ? previewContentToLegacyBlocks(preview) : [];
  if (!blocks.length) return null;
  for (const block of blocks) {
    if (block.type === "text" && block.markdown.includes(trimmed)) {
      return { blockId: block.id, quote: trimmed };
    }
  }
  if (previewText.includes(trimmed)) {
    const textBlock = blocks.find(
      (block): block is Extract<typeof block, { type: "text" }> =>
        block.type === "text",
    );
    if (textBlock) return { blockId: textBlock.id, quote: trimmed };
  }
  return null;
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
      ...patchRunProgress(
        buildRunProgress("collect_revision", "已加入改稿清单"),
      ),
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
        new SystemMessage(
          `提取${YOUGAN_USER_LABEL}对**当前成稿**的改稿意见。只输出 instruction 与可选 quote（引号内原文）。`,
        ),
        new HumanMessage(
          `当前成稿摘要：\n${previewText || "（无正文）"}\n\n${YOUGAN_USER_LABEL}消息：\n${userMessage}`,
        ),
      ],
      { name: "collect_revision" },
      config,
    )) as CollectRevisionOutput;
  } catch {
    parsed = { instruction: userMessage, quote: null };
  }

  const anchorMatch = findAnchorBlockId(previewText, parsed.quote, state);
  const revision = appendRevisionIntent(getRevision(state), {
    instruction: parsed.instruction.trim() || userMessage,
    anchor: anchorMatch
      ? {
          blockId: anchorMatch.blockId,
          quote: anchorMatch.quote,
        }
      : parsed.quote?.trim()
        ? { blockId: "unknown", quote: parsed.quote.trim() }
        : null,
    source: "chat",
  });

  return {
    ...patchPendingRevision(state, revision),
    ...patchRunProgress(
      buildRunProgress("collect_revision", "已加入改稿清单"),
    ),
    ...patchAiUsageMetering(state.aiUsage, config),
  };
}
