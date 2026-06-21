export const TOOL_LABELS: Record<string, string> = {
  preprocess_reference_text: "预处理文本参考",
  preprocess_reference_image: "预处理图片参考",
  preprocess_reference_audio: "预处理音频参考",
  preprocess_reference_video: "预处理视频参考",
  delete_reference: "删除参考素材",
  update_reference_intent: "记录借鉴说明",
  set_pending_references_context: "写入统一借鉴说明",
  reference_apply_patch: "更新参考素材",
  update_profile_direction: "更新方向",
  update_profile_style: "更新风格",
  update_profile_setting: "更新背景",
  update_profile_background: "更新背景",
  update_profile_requirements: "更新需求",
  update_profile_bounds: "更新边界",
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
  const preview = readString(first.spec) || readString(first.summary);
  if (!preview) return null;
  return value.length > 1 ? `${field}：${preview} 等 ${value.length} 项` : `${field}：${preview}`;
}

export function getToolInputSummary(
  toolName: string,
  toolInput: Record<string, unknown>,
) {
  switch (toolName) {
    case "update_profile_direction":
      return (
        readString(toolInput.summary) ||
        readString(toolInput.format) ||
        readString(toolInput.audience)
      );
    case "update_profile_style":
      return (
        readString(toolInput.verbal) || readString(toolInput.visual) || ""
      );
    case "update_profile_setting":
    case "update_profile_background":
      return summarizePatchList(toolInput.items, "背景") ?? "";
    case "update_profile_requirements":
      return summarizePatchList(toolInput.items, "需求") ?? "";
    case "update_profile_bounds":
      return summarizePatchList(toolInput.items, "边界") ?? "";
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
    case "delete_reference":
      return "删除一条参考素材";
    case "update_reference_intent":
    case "set_pending_references_context":
      return readString(toolInput.user_context);
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
