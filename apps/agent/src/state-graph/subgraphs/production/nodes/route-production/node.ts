import type { AgentStatePatch } from "#agent/state.js";

/** 管线流转控制：路由由 afterRouteProduction 条件边读取任务状态 */
export async function routeProductionNode(): Promise<AgentStatePatch> {
  return {};
}
