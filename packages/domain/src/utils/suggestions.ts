import { nanoid } from "nanoid";
import type { NextStepSuggestion } from "../models/suggestions.js";

/** 建议 message 入库/流式解析前仅做空白规范化（不截断） */
export function normalizeNextStepSuggestionMessage(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.trim().replace(/\s+/g, " ");
}

export function newNextStepSuggestion(
  kind: NextStepSuggestion["kind"],
  label: string,
  message: string,
): NextStepSuggestion {
  return { id: nanoid(8), kind, label, message };
}
