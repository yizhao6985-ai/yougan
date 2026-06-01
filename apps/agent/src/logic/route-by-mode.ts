import { parseMode } from "../lib/parse-agent-state.js";
import type { ChatMode } from "../schema.js";
import type { AgentStateType } from "../state.js";

/** 主图入口：按 mode 路由到对应复合 node */
export function routeByMode(state: AgentStateType): ChatMode {
  return parseMode(state);
}

/** mode 值 → graph 节点 id（不能与 state channel 同名） */
export const paths = {
  inspiration: "inspirationGraph",
  creation: "creationGraph",
  ask: "askGraph",
} as const;
