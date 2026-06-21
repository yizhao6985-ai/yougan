/** Agent ↔ LLM 集中超时与重试（超时 abort 后最多再试 1 次）。 */
export const LLM_TIMEOUT_MS = {
  chat: 120_000,
  structured: 180_000,
  /** 下一步建议：条数少、失败可静默跳过，上限应低于 structured */
  suggestions: 120_000,
  production: 480_000,
  image: 90_000,
} as const;

export const LLM_TIMEOUT_FAILURE_MESSAGE = "LLM 响应超时，请稍后重试。";

const MAX_ATTEMPTS = 2;

export class LlmTimeoutError extends Error {
  readonly code = "LLM_TIMEOUT" as const;

  constructor(
    readonly timeoutMs: number,
    readonly attempts: number,
    options?: { cause?: unknown },
  ) {
    super(
      `LLM request timed out after ${attempts} attempt(s) (${timeoutMs}ms each)`,
    );
    this.name = "LlmTimeoutError";
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export function isLlmTimeoutError(error: unknown): error is LlmTimeoutError {
  return error instanceof LlmTimeoutError;
}

function isTimeoutError(error: unknown): boolean {
  if (error != null && typeof error === "object" && "name" in error) {
    return (error as { name: string }).name === "TimeoutError";
  }
  return false;
}

function isTimeoutDeadline(deadline: AbortSignal): boolean {
  if (!deadline.aborted) return false;
  return isTimeoutError(deadline.reason) || deadline.reason == null;
}

function isTimeoutLike(deadline: AbortSignal, error: unknown): boolean {
  return isTimeoutDeadline(deadline) || isTimeoutError(error);
}

/** LangChain structured invoke 可能不响应 AbortSignal；Promise.race 兜底硬超时。 */
function createHardTimeout(timeoutMs: number): {
  promise: Promise<never>;
  clear: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const promise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new DOMException("The operation timed out.", "TimeoutError"));
    }, timeoutMs);
  });
  return {
    promise,
    clear: () => {
      if (timer !== undefined) clearTimeout(timer);
    },
  };
}

function throwLlmTimeout(
  timeoutMs: number,
  attempts: number,
  cause: unknown,
): never {
  throw new LlmTimeoutError(timeoutMs, attempts, { cause });
}

export async function withLlmRetry<T>(opts: {
  parentSignal?: AbortSignal;
  timeoutMs: number;
  run: (signal: AbortSignal) => Promise<T>;
  /** streamChat：已有 chunk 输出时不重试 */
  canRetry?: () => boolean;
}): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const deadline = AbortSignal.timeout(opts.timeoutMs);
    const signal = opts.parentSignal
      ? AbortSignal.any([opts.parentSignal, deadline])
      : deadline;

    const hardTimeout = createHardTimeout(opts.timeoutMs);

    try {
      return await Promise.race([opts.run(signal), hardTimeout.promise]);
    } catch (error) {
      lastError = error;

      if (opts.parentSignal?.aborted) {
        throw error;
      }

      if (opts.canRetry && !opts.canRetry()) {
        if (isTimeoutLike(deadline, error)) {
          throwLlmTimeout(opts.timeoutMs, attempt + 1, error);
        }
        throw error;
      }

      if (!isTimeoutLike(deadline, error)) {
        throw error;
      }

      if (attempt === MAX_ATTEMPTS - 1) {
        throwLlmTimeout(opts.timeoutMs, MAX_ATTEMPTS, error);
      }
    } finally {
      hardTimeout.clear();
    }
  }

  if (lastError != null) {
    throwLlmTimeout(opts.timeoutMs, MAX_ATTEMPTS, lastError);
  }

  throw new LlmTimeoutError(opts.timeoutMs, MAX_ATTEMPTS);
}
