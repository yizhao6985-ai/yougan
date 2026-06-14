import type { AgentStatePatch } from "#agent/state.js";

/** 流转锚点：无状态变更，路由由 afterRouteProduction 条件边负责 */
export async function routeProductionNode(): Promise<AgentStatePatch> {
  return {};
}
