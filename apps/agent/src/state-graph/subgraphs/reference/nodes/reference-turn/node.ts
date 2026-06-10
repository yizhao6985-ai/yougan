/**
 * reference-turn：确认 ingest 结果；删/改意图经 reference_apply_patch（改意图由 summarizeIntent 归纳）。
 */
import { SystemMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";

import { env } from "#agent/env.js";
import { streamChat } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import type { AgentStateType } from "#agent/state.js";

import { REFERENCE_TOOLS } from "../tool-node/tools/index.js";
import { buildReferencePrompt } from "./prompt.js";

const llmWithTools = createChatModel({
  temperature: env.llmTemperature,
}).bindTools(REFERENCE_TOOLS);

export async function referenceTurnNode(
  state: AgentStateType,
  config: RunnableConfig,
): Promise<Partial<AgentStateType>> {
  const response = await streamChat(
    llmWithTools,
    [
      new SystemMessage(buildReferencePrompt(state)),
      ...(state.messages ?? []),
    ],
    config,
  );

  return { messages: [response] };
}
