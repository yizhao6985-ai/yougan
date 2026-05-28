import { CHAT_MODE_LABELS } from "@/lib/types";
import type { ChatMode } from "@/lib/types";

export const TOOL_LABELS: Record<string, string> = {
  switch_mode: "切换模式",
  confirm_requirement: "确认灵感",
  update_requirement: "修改灵感",
  delete_requirement: "删除灵感",
  clear_inspirations: "清空灵感",
  sync_outline_from_inspiration: "同步大纲",
  add_pending_change: "添加大纲条目",
  complete_outline: "定稿创作大纲",
  complete_plan: "定稿创作大纲",
  complete_execution: "完成执行",
  update_work_profile: "更新作品特征",
  parse_reference_text: "解析参考文案",
  parse_reference_image: "解析参考图片",
  generate_content: "生成文案",
};

const PROFILE_FIELD_LABELS: Record<string, string> = {
  platform: "平台",
  content_topic: "主题",
  content_type: "内容类型",
  content_points: "内容要点",
  style: "风格",
  tone: "语气",
  persona: "人设",
  style_constraints: "风格约束",
  audience: "受众",
  goals: "目标",
  notes: "备注",
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
    case "add_pending_change":
    case "confirm_requirement":
    case "update_requirement":
      return readString(toolInput.description);
    case "delete_requirement":
      return readString(toolInput.requirement_id) || "删除灵感条目";
    case "complete_outline":
    case "complete_plan":
    case "complete_execution":
      return readString(toolInput.summary);
    case "switch_mode": {
      const mode = toolInput.mode as ChatMode | undefined;
      return mode ? `切换到${CHAT_MODE_LABELS[mode]}` : "";
    }
    case "update_work_profile": {
      const fields = Object.keys(toolInput).filter(
        (key) => toolInput[key] != null && key in PROFILE_FIELD_LABELS,
      );
      if (!fields.length) return "";
      return fields.map((key) => PROFILE_FIELD_LABELS[key]).join("、");
    }
    case "parse_reference_text":
      return truncate(readString(toolInput.reference_text), 80);
    case "parse_reference_image":
      return readString(toolInput.hint) || "解析参考图片风格";
    case "generate_content":
      return "按创作大纲生成文案";
    case "sync_outline_from_inspiration":
      return "根据灵感同步大纲";
    case "clear_inspirations":
      return "清空全部灵感";
    default:
      return "";
  }
}

export function getToolOutputMessage(toolOutput: unknown, toolError?: string) {
  if (toolError) return toolError;
  if (typeof toolOutput === "string") return toolOutput.trim();
  return "";
}

export function getToolActivitySummary(input: {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: unknown;
  toolError?: string;
}) {
  const outputMessage = getToolOutputMessage(input.toolOutput, input.toolError);
  if (outputMessage) return outputMessage;

  const inputSummary = getToolInputSummary(input.toolName, input.toolInput);
  if (inputSummary) return inputSummary;

  return getToolLabel(input.toolName);
}
