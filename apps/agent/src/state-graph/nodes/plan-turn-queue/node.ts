import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import {
  filterProductionQueue,
  type TurnQueueKind,
  type TurnQueuePlannerKind,
} from "@yougan/domain";

import {
  resetRunMeteringAccumulator,
  patchAiUsageMetering,
} from "#agent/llm/invoke/metering.js";

import { sortTurnQueue } from "./helpers/sort-turn-queue.js";
import { tryResolvePreviewSelectionQueue } from "./helpers/try-resolve-preview-selection-queue.js";
import { finalizeTurnQueue } from "./helpers/finalize-turn-queue.js";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getHumanMessageContents,
  getLatestHumanMessageAttachments,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import { getPreview, getProduction, getProfile } from "#agent/state-io/index.js";
import {
  initPendingTurn,
  mergeTurnPatch,
  normalizeDirtyTurnState,
  patchTurn,
} from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { buildTurnQueuePrompt } from "./prompt.js";
import { TurnQueueDecisionSchema, type TurnQueueDecision } from "./schema.js";

const DEFAULT_QUEUE: TurnQueueKind[] = finalizeTurnQueue(["profile"]);
const OPENING_QUEUE: TurnQueueKind[] = [];

/**
 * 方案向导状态门：未到「方案就绪」时剔除 production；整稿重做与局部改稿互斥。
 * 用户意图完全由 planTurnQueue LLM 判定，此处不做话术正则。
 */
function withProductionQueueGate(
  queue: TurnQueuePlannerKind[],
  state: AgentStateType,
): TurnQueuePlannerKind[] {
  return filterProductionQueue(queue, getProfile(state), {
    preview: getPreview(state),
    production: getProduction(state),
  });
}

/**
 * 合并模型队列与 reference 子图入队规则：
 * - 无附件：原样返回（reference 仅当模型判定为删/改参考素材时才会出现）
 * - 有附件且队列已含 reference：原样返回，避免重复
 * - 有附件且纯 ask：不前置 reference（纯讨论不入库）
 * - 有附件且非纯 ask：确定性前置 reference，供 preprocessReferences 预处理新附件
 */
function withReferenceQueue(
  queue: TurnQueueKind[],
  hasAttachments: boolean,
): TurnQueueKind[] {
  const sorted = sortTurnQueue(queue);
  const base: TurnQueueKind[] = sorted.length ? sorted : ["profile"];
  if (!hasAttachments || base.includes("reference")) {
    return finalizeTurnQueue(base);
  }

  const askOnly = base.length === 1 && base[0] === "ask";
  if (askOnly) return finalizeTurnQueue(base);

  return finalizeTurnQueue(
    sortTurnQueue(["reference", ...base] as TurnQueueKind[]),
  );
}

async function resolveTurnQueue(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<TurnQueueKind[]> {
  if (getHumanMessageContents(state.messages).length < 1) {
    return OPENING_QUEUE;
  }

  const userMessage = getLatestHumanMessageText(state.messages);
  const hasAttachments =
    getLatestHumanMessageAttachments(state.messages).length > 0;

  const previewSelectionQueue = tryResolvePreviewSelectionQueue(
    state,
    userMessage,
  );
  if (previewSelectionQueue) {
    return withReferenceQueue(
      withProductionQueueGate(previewSelectionQueue, state),
      hasAttachments,
    );
  }

  if (!userMessage && !hasAttachments) {
    return DEFAULT_QUEUE;
  }

  const llm = createChatModel({ temperature: 0.1 });
  const prompt = buildTurnQueuePrompt(state, userMessage);

  try {
    const parsed = (await invokeStructured(
      llm,
      TurnQueueDecisionSchema,
      [new HumanMessage(prompt)],
      { name: "turn_queue_decision" },
      config,
    )) as TurnQueueDecision;
    const queue = sortTurnQueue(parsed.kinds);
    const base: TurnQueuePlannerKind[] = queue.length ? queue : ["profile"];
    return withReferenceQueue(
      withProductionQueueGate(base, state),
      hasAttachments,
    );
  } catch {
    return withReferenceQueue(["profile"], hasAttachments);
  }
}

/** planTurnQueue：归一化脏回合 → 解析 queue → fork turn.staging */
export async function planTurnQueueNode(
  state: AgentStateType,
  config?: RunnableConfig,
): Promise<AgentStatePatch> {
  const normalized = normalizeDirtyTurnState(state);
  const baseState: AgentStateType = normalized?.turn
    ? { ...state, turn: mergeTurnPatch(state, normalized.turn) }
    : state;

  resetRunMeteringAccumulator(config);
  const queue = await resolveTurnQueue(baseState, config);
  const staging = initPendingTurn(baseState, queue);

  return {
    ...(normalized ?? {}),
    turnDirections: null,
    ...patchTurn(baseState, {
      queue,
      staging,
      completedKinds: [],
      activeKind: null,
      committed: false,
      cancelled: false,
    }),
    ...patchAiUsageMetering(baseState.aiUsage, config),
  };
}
