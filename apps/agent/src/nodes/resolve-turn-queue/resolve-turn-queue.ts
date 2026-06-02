import { HumanMessage } from "@langchain/core/messages";

import { sortTurnTasks, type TurnTaskKind } from "@yougan/domain";

import { createStructuredModel } from "../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../lib/structured-output.js";
import { getLatestHumanMessageText } from "../../lib/human-message/index.js";
import type { AgentStateType } from "../../state.js";
import { buildTurnQueuePrompt } from "./prompt.js";
import { TurnQueueDecisionSchema } from "./schema.js";

const DEFAULT_TASK_QUEUE: TurnTaskKind[] = ["inspiration"];

/** 用大模型结构化输出解析本轮任务队列。 */
export async function resolveTurnTaskQueue(
  state: AgentStateType,
): Promise<TurnTaskKind[]> {
  const userMessage = getLatestHumanMessageText(state.messages);
  if (!userMessage) {
    return DEFAULT_TASK_QUEUE;
  }

  const llm = createStructuredModel({ temperature: 0.1 });
  const prompt = buildTurnQueuePrompt(state, userMessage);

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      TurnQueueDecisionSchema,
      [new HumanMessage(prompt)],
      { name: "turn_queue_decision" },
    );
    const tasks = sortTurnTasks(parsed.tasks);
    return tasks.length ? tasks : DEFAULT_TASK_QUEUE;
  } catch {
    return DEFAULT_TASK_QUEUE;
  }
}
