/**
 * 百炼 Chat 模型族差异：kwargs 与计量映射。
 */
import type { MeteringModelId } from "@yougan/domain";

export type DashScopeChatFamily = "qwen" | "glm" | "omni";

export type DashScopeChatScenario = "stream" | "structured";

const USAGE_STREAM_OPTIONS = {
  stream_options: { include_usage: true },
} as const;

export function resolveDashScopeChatFamily(
  modelId: string,
): DashScopeChatFamily {
  const normalized = modelId.toLowerCase();
  if (normalized.includes("omni")) return "omni";
  if (normalized.startsWith("glm") || normalized.includes("/glm")) {
    return "glm";
  }
  return "qwen";
}

export function getDashScopeChatKwargs(
  family: DashScopeChatFamily,
  scenario: DashScopeChatScenario,
): Record<string, unknown> {
  const base = {
    enable_thinking: false,
    ...USAGE_STREAM_OPTIONS,
  };

  switch (family) {
    case "qwen":
      return { ...base, incremental_output: true };
    case "glm":
      return scenario === "stream" ? { ...base, tool_stream: true } : base;
    case "omni":
      return {
        ...base,
        modalities: ["text"],
      };
  }
}

/** 将 env 模型名映射到计量单价表 */
export function resolveDashScopeMeteringModelId(
  modelName: string,
): MeteringModelId {
  const normalized = modelName.toLowerCase();
  if (normalized.includes("omni")) return "qwen-omni-flash";
  if (normalized.includes("glm")) return "glm-5.2";
  if (normalized.includes("plus")) return "qwen-plus";
  return "qwen-max";
}
