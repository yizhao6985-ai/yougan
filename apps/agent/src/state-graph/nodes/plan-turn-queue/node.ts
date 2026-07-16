import { HumanMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { NodeError } from "@langchain/langgraph";

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
import { withExplicitProductionIntent } from "./helpers/explicit-production-intent.js";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import {
  getHumanMessageContents,
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

import { rethrowUnlessRecoverable } from "../../helpers/recoverable-node-error.js";
import { buildTurnQueuePrompt } from "./prompt.js";
import { TurnQueueDecisionSchema, type TurnQueueDecision } from "./schema.js";

const DEFAULT_QUEUE: TurnQueueKind[] = finalizeTurnQueue(["profile"]);
const OPENING_QUEUE: TurnQueueKind[] = [];

/**
 * 方案向导状态门：必填（定位+体裁）未齐时剔除 production；整稿重做与局部改稿互斥。
 * 可选步未填不拦截。明确开制口令由 withExplicitProductionIntent 确定性补入。
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

function finalizeQueue(
  queue: TurnQueuePlannerKind[],
  state: AgentStateType,
  userMessage: string,
): TurnQueueKind[] {
  return finalizeTurnQueue(
    sortTurnQueue(
      withProductionQueueGate(
        withExplicitProductionIntent(queue, userMessage),
        state,
      ),
    ),
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

  const previewSelectionQueue = tryResolvePreviewSelectionQueue(
    state,
    userMessage,
  );
  if (previewSelectionQueue) {
    return finalizeQueue(previewSelectionQueue, state, userMessage);
  }

  if (!userMessage) {
    return DEFAULT_QUEUE;
  }

  const llm = createChatModel({ temperature: 0.1 });
  const prompt = buildTurnQueuePrompt(state, userMessage);

  const parsed = (await invokeStructured(
    llm,
    TurnQueueDecisionSchema,
    [new HumanMessage(prompt)],
    { name: "turn_queue_decision" },
    config,
  )) as TurnQueueDecision;
  const queue = sortTurnQueue(parsed.kinds);
  const base: TurnQueuePlannerKind[] = queue.length ? queue : ["profile"];
  return finalizeQueue(base, state, userMessage);
}

function planTurnQueuePatch(
  state: AgentStateType,
  queue: TurnQueueKind[],
  config?: RunnableConfig,
): AgentStatePatch {
  const normalized = normalizeDirtyTurnState(state);
  const baseState: AgentStateType = normalized?.turn
    ? { ...state, turn: mergeTurnPatch(state, normalized.turn) }
    : state;

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
  return planTurnQueuePatch(state, queue, config);
}

export function planTurnQueueErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  const normalized = normalizeDirtyTurnState(state);
  const baseState: AgentStateType = normalized?.turn
    ? { ...state, turn: mergeTurnPatch(state, normalized.turn) }
    : state;
  const userMessage = getLatestHumanMessageText(baseState.messages);
  const queue = finalizeQueue(["profile"], baseState, userMessage);
  return planTurnQueuePatch(state, queue);
}
