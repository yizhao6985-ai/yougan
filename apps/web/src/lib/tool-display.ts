export const TOOL_LABELS: Record<string, string> = {
  preprocess_reference_text: "预处理文本参考",
  preprocess_reference_image: "预处理图片参考",
  preprocess_reference_audio: "预处理音频参考",
  preprocess_reference_video: "预处理视频参考",
  reference_apply_patch: "更新参考素材",
  update_profile_intent: "更新创作定位",
  update_profile_delivery: "更新体裁与参数",
  update_profile_expression: "更新表达设定",
  update_profile_structure: "更新结构与要素",
  update_profile_constraints: "更新创作规则",
  add_plan_task: "添加制作任务",
  execute_task: "执行任务",
  generate_preview: "AI 团队制作",
  generate_design: "AI 团队绘画",
  revise_production_plan: "调整制作计划",
  tavily_search: "联网搜索",
};

export type ToolActivityState =
  | "pending"
  | "running"
  | "completed"
  | "error";

export function getToolLabel(toolName: string) {
  return TOOL_LABELS[toolName] ?? toolName.replace(/_/g, " ");
}

export function getToolActivityState(input: {
  toolError?: string;
  isStreaming?: boolean;
  toolOutput?: unknown;
}): ToolActivityState {
  if (input.toolError) return "error";
  if (input.isStreaming) return "running";
  if (input.toolOutput !== undefined) return "completed";
  return "pending";
}

export const TOOL_STATE_LABELS: Record<ToolActivityState, string> = {
  pending: "等待中",
  running: "执行中",
  completed: "已完成",
  error: "失败",
};

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function summarizePatchList(
  value: unknown,
  field: string,
): string | null {
  if (!Array.isArray(value) || !value.length) return null;
  const first = value[0] as Record<string, unknown>;
  const preview = readString(first.description) || readString(first.summary);
  if (!preview) return null;
  return value.length > 1 ? `${field}：${preview} 等 ${value.length} 项` : `${field}：${preview}`;
}

function summarizeDeliveryParams(toolInput: Record<string, unknown>): string {
  const parts: string[] = [];
  const format = readString(toolInput.format);
  const platform = readString(toolInput.platform);
  if (format) parts.push(format);
  if (platform) parts.push(platform);

  const min = toolInput.word_count_min;
  const max = toolInput.word_count_max;
  if (typeof min === "number" || typeof max === "number") {
    if (typeof min === "number" && typeof max === "number" && min === max) {
      parts.push(`${min} 字`);
    } else {
      const range = [
        typeof min === "number" ? `${min}` : null,
        typeof max === "number" ? `${max}` : null,
      ]
        .filter(Boolean)
        .join("–");
      if (range) parts.push(`${range} 字`);
    }
  }

  if (typeof toolInput.duration_sec === "number") {
    parts.push(`${toolInput.duration_sec} 秒`);
  }
  if (readString(toolInput.aspect_ratio)) {
    parts.push(readString(toolInput.aspect_ratio));
  }

  return parts.join(" · ");
}

export function getToolInputSummary(
  toolName: string,
  toolInput: Record<string, unknown>,
) {
  switch (toolName) {
    case "update_profile_delivery":
      return summarizeDeliveryParams(toolInput);
    case "update_profile_intent":
      return readString(toolInput.summary);
    case "update_profile_structure":
      return (
        summarizePatchList(toolInput.settings, "设定") ??
        summarizePatchList(toolInput.segments, "结构") ??
        ""
      );
    case "update_profile_constraints":
      return summarizePatchList(toolInput.rules, "规则") ?? "";
    case "reference_apply_patch": {
      const updates = toolInput.updates;
      if (Array.isArray(updates) && updates.length) {
        return `更新 ${updates.length} 条参考意图`;
      }
      const deletes = toolInput.deletes;
      if (Array.isArray(deletes) && deletes.length) {
        return `删除 ${deletes.length} 条参考`;
      }
      return "更新参考素材";
    }
    case "add_plan_task":
      return readString(toolInput.description);
    case "revise_production_plan":
      return readString(toolInput.reason);
    case "execute_task":
      return "按任务逐项执行";
    case "tavily_search":
      return readString(toolInput.query);
    case "generate_preview":
      return "AI 团队按计划制作";
    case "generate_design":
      return "AI 团队按制作计划绘画";
    case "preprocess_reference_text":
    case "preprocess_reference_image":
    case "preprocess_reference_audio":
    case "preprocess_reference_video":
      return readString(toolInput.asset_url);
    default:
      return "";
  }
}

export function getToolDescription(input: {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: unknown;
  toolError?: string;
}) {
  if (input.toolError) return input.toolError;
  const summary = getToolInputSummary(input.toolName, input.toolInput);
  if (summary) return summary;
  if (typeof input.toolOutput === "string" && input.toolOutput.trim()) {
    return input.toolOutput.trim();
  }
  return "";
}
