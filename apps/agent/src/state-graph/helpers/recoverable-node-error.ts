/**
 * errorHandler 可恢复错误判定。
 * abort / interrupt 不可恢复；超时与常见 LLM/网络失败可降级。
 */
import { isNodeTimeoutError, type NodeError } from "@langchain/langgraph";

export function isAbortLikeError(error: unknown): boolean {
  if (isNodeTimeoutError(error)) return false;
  if (!error || typeof error !== "object") return false;
  const name = "name" in error ? String(error.name) : "";
  const message = "message" in error ? String(error.message) : "";
  if (name === "AbortError") return true;
  return (
    message.startsWith("Cancel") ||
    message.startsWith("AbortError") ||
    /aborted/i.test(message)
  );
}

function httpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const withStatus = error as {
    status?: unknown;
    response?: { status?: unknown };
  };
  if (typeof withStatus.status === "number") return withStatus.status;
  if (typeof withStatus.response?.status === "number") {
    return withStatus.response.status;
  }
  return undefined;
}

/** 节点失败后是否允许 errorHandler 降级（而非整图冒泡） */
export function isRecoverableLlmError(error: unknown): boolean {
  if (isNodeTimeoutError(error)) return true;
  if (isAbortLikeError(error)) return false;
  if (!(error instanceof Error)) return false;

  if (error.message === "STRUCTURED_OUTPUT_PARSE_FAILED") return true;

  const status = httpStatus(error);
  if (
    typeof status === "number" &&
    (status === 408 || status === 429 || status >= 500)
  ) {
    return true;
  }

  const name = error.name;
  if (
    name === "APIError" ||
    name === "RateLimitError" ||
    name === "APIConnectionError" ||
    name === "TimeoutError"
  ) {
    return true;
  }

  return /ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|ECONNABORTED|socket hang up|fetch failed|network/i.test(
    error.message,
  );
}

/** errorHandler 入口：不可恢复则抛出底层 error */
export function rethrowUnlessRecoverable(error: NodeError): void {
  if (!isRecoverableLlmError(error.error)) throw error.error;
}
