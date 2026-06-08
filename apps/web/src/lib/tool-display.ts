export const TOOL_LABELS: Record<string, string> = {
  reference_apply_patch: "更新参考素材",
  profile_apply_patch: "更新作品方案",
  add_plan_task: "添加制作任务",
  complete_execution: "完成执行",
  generate_preview: "AI 团队出稿",
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
    case "profile_apply_patch": {
      const parts: string[] = [];
      const delivery = toolInput.delivery as Record<string, unknown> | undefined;
      if (delivery?.topic) parts.push(readString(delivery.topic));
      if (toolInput.summary) parts.push(readString(toolInput.summary));
      const segments =
        summarizePatchList(toolInput.segments_replace, "结构") ??
        summarizePatchList(toolInput.segments_append, "结构");
      if (segments) parts.push(segments);
      const guardrails =
        summarizePatchList(toolInput.guardrails_replace, "规则") ??
        summarizePatchList(toolInput.guardrails_append, "规则");
      if (guardrails) parts.push(guardrails);
      if (!parts.length && delivery) {
        return Object.keys(delivery)
          .filter((key) => delivery[key] != null)
          .join("、");
      }
      return parts.join(" · ");
    }
    case "reference_apply_patch": {
      const deletes = toolInput.deletes;
      if (Array.isArray(deletes) && deletes.length) {
        return `删除 ${deletes.length} 条参考`;
      }
      if (toolInput.delete) return "删除参考素材";
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
      return "AI 团队按制作计划出稿";
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
