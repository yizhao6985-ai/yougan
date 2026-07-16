/**
 * LLM 节点超时 / 重试：交给 LangGraph `addNode({ timeout, retryPolicy })`，
 * 不在 invoke 层自建墙钟与重试。
 *
 * @see https://docs.langchain.com/oss/javascript/langgraph/fault-tolerance
 */
import {
  isNodeTimeoutError,
  type NodePolicyOptions,
  type RetryPolicy,
} from "@langchain/langgraph";

export const LLM_TIMEOUT_MS = {
  chat: 120_000,
  structured: 180_000,
  /** 下一步建议：条数少、失败可静默跳过，不重试 */
  suggestions: 60_000,
  production: 480_000,
} as const;

export const LLM_TIMEOUT_FAILURE_MESSAGE = "LLM 响应超时，请稍后重试。";

/** 可恢复 LLM 失败（非超时）时的用户可见文案 */
export const LLM_FAILURE_MESSAGE = "服务暂时不可用，请稍后重试。";

/** 仅对节点超时重试一次（含首次共 2 次），与旧 withLlmRetry 对齐 */
export const LLM_TIMEOUT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 2,
  retryOn: (error) => isNodeTimeoutError(error),
};

export type LlmNodePolicyOptions = Pick<
  NodePolicyOptions,
  "timeout" | "retryPolicy"
>;

/** 结构化 / 制作类 LLM 节点：墙钟超时 + 超时重试 */
export function llmNodePolicy(timeoutMs: number): LlmNodePolicyOptions {
  return {
    timeout: timeoutMs,
    retryPolicy: LLM_TIMEOUT_RETRY_POLICY,
  };
}

/** 流式对话 / 可静默跳过：仅超时，不重试（避免 pushMessage 重复） */
export function llmTimeoutOnly(timeoutMs: number): LlmNodePolicyOptions {
  return { timeout: timeoutMs };
}
