import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../lib/structured-output.js";
import { messageContentToText } from "../../lib/message-content.js";
import {
  parseBrief,
  parseMode,
  parseProductionPlan,
} from "../../lib/parse-agent-state.js";
import type { ChatMode } from "../../schema.js";
import type { AgentStateType } from "../../state.js";
import { buildTurnModePrompt } from "./prompt.js";
import { TurnModeDecisionSchema } from "./schema.js";

const CREATION_PATTERN =
  /开始(?:写|创作|制作|出稿)|出稿|生成(?:一版|文案|成稿)|按计划|执行计划|写吧|制作|改稿|重写|改(?:标题|语气|文案)|继续执行|交付|按制作计划/i;

const ASK_PATTERN =
  /[?？]$|怎么|为什么|为啥|能不能|可以吗|是否|怎么样|如何|合适吗|好不好|帮我看|有没有|什么是|什么意思|区别|对比|建议吗/i;

const INSPIRATION_PATTERN =
  /定(?:方向|选题|平台|受众)|就这些|没有了|确认|记(?:下|录)|需求|brief|灵感|选题|平台|受众/i;

export function getLatestHumanMessageText(state: AgentStateType): string {
  const messages = state.messages ?? [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message?.getType?.() === "human" || message?._getType?.() === "human") {
      return messageContentToText(message.content).trim();
    }
  }
  return "";
}

export function heuristicTurnMode(
  state: AgentStateType,
  userMessage: string,
): ChatMode | null {
  const text = userMessage.trim();
  if (!text) return null;

  const brief = parseBrief(state);
  const plan = parseProductionPlan(state);
  const hasPendingTasks = (plan.pending_tasks?.length ?? 0) > 0;

  if (CREATION_PATTERN.test(text)) {
    return "creation";
  }

  if (hasPendingTasks && /继续|执行|开始/i.test(text)) {
    return "creation";
  }

  if (brief.ready && /改|调整|再/.test(text) && !ASK_PATTERN.test(text)) {
    return "creation";
  }

  if (INSPIRATION_PATTERN.test(text) && !ASK_PATTERN.test(text)) {
    return "inspiration";
  }

  if (ASK_PATTERN.test(text) && !CREATION_PATTERN.test(text)) {
    return "ask";
  }

  return null;
}

export async function resolveTurnMode(state: AgentStateType): Promise<ChatMode> {
  const userMessage = getLatestHumanMessageText(state);
  if (!userMessage) {
    return parseMode(state);
  }

  const heuristic = heuristicTurnMode(state, userMessage);
  if (heuristic) {
    return heuristic;
  }

  const llm = createStructuredModel({ temperature: 0.1 });
  const prompt = buildTurnModePrompt(state, userMessage);

  try {
    const parsed = await invokeStructuredOutput(
      llm,
      TurnModeDecisionSchema,
      [new HumanMessage(prompt)],
      { name: "turn_mode_decision" },
    );
    return parsed.mode;
  } catch {
    return parseMode(state) || "inspiration";
  }
}
