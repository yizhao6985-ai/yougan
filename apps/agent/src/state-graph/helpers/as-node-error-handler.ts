import type { NodeError } from "@langchain/langgraph";

import type { AgentStatePatch, AgentStateType } from "#agent/state.js";

/**
 * LangGraph `errorHandler` 的 Update 类型要求完整 channel 值，
 * 而本仓库节点统一返回 `AgentStatePatch`（含 `turn` 浅合并）。
 * 运行时语义一致，此处仅做类型桥接。
 */
export function asNodeErrorHandler<T>(
  handler: (
    state: AgentStateType,
    error: NodeError,
  ) => AgentStatePatch | Promise<AgentStatePatch>,
): T {
  return handler as T;
}

/** LangGraph 为 `errorHandler` 自动注册的节点名 */
export function errorHandlerNodeId(nodeName: string): string {
  return `__error_handler__${nodeName}`;
}

/**
 * 把 `__error_handler__<node>` 并入条件边 pathMap，供 Studio / xray 画图。
 *
 * LangGraph 会为 errorHandler 注册无入边节点；子图 `getGraphAsync({ xray })`
 * 在 trim START/END 后会出现多个根节点，从而抛出 missing entrypoint。
 * 路由函数永不返回该 key，不影响运行时。
 */
export function withErrorHandlerDrawingPath<
  P extends Record<string, string>,
>(nodeName: string, paths: P): P {
  const id = errorHandlerNodeId(nodeName);
  return { ...paths, [id]: id } as P;
}
