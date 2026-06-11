export const TOOL_LABELS: Record<string, string> = {
  reference_apply_patch: "更新参考素材",
  update_profile_delivery: "更新交付规格",
  update_profile_summary: "更新内容定位",
  update_profile_expression: "更新表达设定",
  update_profile_params: "更新体裁参数",
  append_profile_setting: "追加创作设定",
  update_profile_setting: "修改创作设定",
  delete_profile_setting: "删除创作设定",
  replace_profile_settings: "替换创作设定",
  clear_profile_settings: "清空创作设定",
  append_profile_segment: "追加结构段",
  update_profile_segment: "修改结构段",
  delete_profile_segment: "删除结构段",
  replace_profile_segments: "替换结构段",
  clear_profile_segments: "清空结构段",
  append_profile_guardrail: "追加创作规则",
  update_profile_guardrail: "修改创作规则",
  delete_profile_guardrail: "删除创作规则",
  replace_profile_guardrails: "替换创作规则",
  clear_profile_guardrails: "清空创作规则",
  add_plan_task: "添加制作任务",
  complete_execution: "完成执行",
  generate_preview: "AI 团队制作",
  generate_design: "AI 团队绘画",
  spawn_specialist: "调度专员",
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

function truncate(text: string, max = 120) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

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

export function getToolInputSummary(
  toolName: string,
  toolInput: Record<string, unknown>,
  options?: { full?: boolean },
) {
  switch (toolName) {
    case "update_profile_delivery":
      return readString(toolInput.topic) || readString(toolInput.format);
    case "update_profile_summary":
      return readString(toolInput.summary);
    case "append_profile_setting":
    case "update_profile_setting":
      return readString(toolInput.description) || readString(toolInput.title);
    case "append_profile_segment":
    case "update_profile_segment":
      return readString(toolInput.description) || readString(toolInput.title);
    case "append_profile_guardrail":
    case "update_profile_guardrail":
      return readString(toolInput.description);
    case "replace_profile_settings":
      return summarizePatchList(toolInput.settings, "设定") ?? "替换创作设定";
    case "replace_profile_segments":
      return summarizePatchList(toolInput.segments, "结构") ?? "替换结构段";
    case "replace_profile_guardrails":
      return summarizePatchList(toolInput.guardrails, "规则") ?? "替换创作规则";
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
    case "spawn_specialist":
      return readString(toolInput.brief) || readString(toolInput.department);
    case "revise_production_plan":
      return readString(toolInput.reason);
    case "complete_execution":
      return readString(toolInput.summary);
    case "tavily_search":
      return readString(toolInput.query);
    case "generate_preview":
      return "AI 团队按计划制作";
    case "generate_design":
      return "AI 团队按制作计划绘画";
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
