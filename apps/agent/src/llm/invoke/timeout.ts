/** Agent ↔ LLM 集中超时与重试（超时 abort 后最多再试 1 次）。 */
export const LLM_TIMEOUT_MS = {
  chat: 120_000,
  structured: 180_000,
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

function isTimeoutDeadline(deadline: AbortSignal): boolean {
  if (!deadline.aborted) return false;
  const reason = deadline.reason;
  if (reason != null && typeof reason === "object" && "name" in reason) {
    return (reason as { name: string }).name === "TimeoutError";
  }
  return true;
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

    try {
      return await opts.run(signal);
    } catch (error) {
      lastError = error;

      if (opts.parentSignal?.aborted) {
        throw error;
      }

      if (opts.canRetry && !opts.canRetry()) {
        if (isTimeoutDeadline(deadline)) {
          throwLlmTimeout(opts.timeoutMs, attempt + 1, error);
        }
        throw error;
      }

      if (!isTimeoutDeadline(deadline)) {
        throw error;
      }

      if (attempt === MAX_ATTEMPTS - 1) {
        throwLlmTimeout(opts.timeoutMs, MAX_ATTEMPTS, error);
      }
    }
  }

  if (lastError != null) {
    throwLlmTimeout(opts.timeoutMs, MAX_ATTEMPTS, lastError);
  }

  throw new LlmTimeoutError(opts.timeoutMs, MAX_ATTEMPTS);
}
