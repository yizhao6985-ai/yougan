export const TOOL_LABELS: Record<string, string> = {
  update_profile_spec: "更新创作规格",
  update_profile_voice: "更新表达设定",
  set_profile_premise: "更新方案定位",
  add_profile_constraint: "添加写作要求",
  update_profile_constraint: "修改写作要求",
  delete_profile_constraint: "删除写作要求",
  clear_profile_constraints: "清空写作要求",
  add_profile_beat: "添加内容节拍",
  update_profile_beat: "修改内容节拍",
  delete_profile_beat: "删除内容节拍",
  clear_profile_beats: "清空内容节拍",
  revise_profile: "重做作品方案",
  add_profile_constraint_from_ask: "记入作品方案",
  add_plan_task: "添加制作任务",
  complete_execution: "完成执行",
  parse_reference_text: "解析参考文案",
  parse_reference_image: "解析参考图片",
  generate_preview: "AI 团队出稿",
  generate_design: "AI 团队绘画",
  spawn_specialist: "调度专员",
  revise_production_plan: "调整制作计划",
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

export function getToolInputSummary(
  toolName: string,
  toolInput: Record<string, unknown>,
) {
  switch (toolName) {
    case "add_profile_beat":
    case "add_profile_constraint":
    case "add_profile_constraint_from_ask":
    case "update_profile_constraint":
    case "update_profile_beat":
    case "add_plan_task":
      return readString(toolInput.description);
    case "set_profile_premise":
      return readString(toolInput.premise);
    case "spawn_specialist":
      return readString(toolInput.brief) || readString(toolInput.department);
    case "revise_profile":
    case "revise_production_plan":
      return readString(toolInput.reason);
    case "delete_profile_constraint":
      return readString(toolInput.constraint_id) || "删除写作要求";
    case "delete_profile_beat":
      return readString(toolInput.beat_id) || "删除内容节拍";
    case "complete_execution":
      return readString(toolInput.summary);
    case "update_profile_spec":
    case "update_profile_voice":
      return Object.keys(toolInput)
        .filter((key) => toolInput[key] != null)
        .join("、");
    case "parse_reference_text":
      return truncate(readString(toolInput.reference_text), 80);
    case "parse_reference_image":
      return readString(toolInput.hint) || "解析参考图片风格";
    case "generate_preview":
      return "AI 团队按制作计划出稿";
    case "generate_design":
      return "AI 团队按制作计划绘画";
    case "clear_profile_constraints":
      return "清空写作要求";
    case "clear_profile_beats":
      return "清空内容节拍";
    default:
      return "";
  }
}

export function getToolOutputMessage(
  toolOutput: unknown,
  toolError?: string,
): string {
  if (toolError) return toolError;
  if (typeof toolOutput === "string") {
    return truncate(toolOutput, 160);
  }
  if (!toolOutput || typeof toolOutput !== "object") return "";
  const record = toolOutput as Record<string, unknown>;
  if (typeof record.message === "string") return truncate(record.message, 160);
  return "";
}

export function getToolOutputSummary(
  toolName: string,
  toolOutput: unknown,
): string {
  return getToolOutputMessage(toolOutput) || getToolLabel(toolName);
}

export function getToolActivitySummary(input: {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: unknown;
  toolError?: string;
}): string {
  if (input.toolError) return input.toolError;
  const outputMessage = getToolOutputMessage(input.toolOutput);
  if (outputMessage) return outputMessage;
  const inputSummary = getToolInputSummary(input.toolName, input.toolInput);
  if (inputSummary) return inputSummary;
  return getToolLabel(input.toolName);
}
