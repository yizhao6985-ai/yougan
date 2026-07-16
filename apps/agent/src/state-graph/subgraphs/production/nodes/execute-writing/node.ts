/** 文案执行者：产出当前 in_progress 任务 */
import type { RunnableConfig } from "@langchain/core/runnables";
import {
  isNodeTimeoutError,
  type NodeError,
} from "@langchain/langgraph";

import {
  LLM_FAILURE_MESSAGE,
  LLM_TIMEOUT_FAILURE_MESSAGE,
} from "#agent/llm/invoke/timeout.js";
import { getProduction } from "#agent/state-io/index.js";
import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

import { rethrowUnlessRecoverable } from "../../../../helpers/recoverable-node-error.js";
import { markActiveTaskFailed } from "../../helpers/mark-task-failed.js";
import { currentActiveTask } from "../../helpers/task-plan.js";
import { produceNextTask } from "./helpers/produce-task.js";

export async function executeWritingNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<AgentStatePatch> {
  return produceNextTask(state, "executeWriting", config);
}

/** 重试耗尽后：标记当前任务失败，避免整图中断 */
export function executeWritingErrorHandler(
  state: AgentStateType,
  error: NodeError,
): AgentStatePatch {
  rethrowUnlessRecoverable(error);
  const task = currentActiveTask(getProduction(state));
  if (!task) return {};
  const message = isNodeTimeoutError(error.error)
    ? LLM_TIMEOUT_FAILURE_MESSAGE
    : LLM_FAILURE_MESSAGE;
  return markActiveTaskFailed(state, task.id, message);
}
