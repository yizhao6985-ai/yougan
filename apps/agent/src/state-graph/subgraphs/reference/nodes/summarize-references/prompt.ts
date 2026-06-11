import { profileReferencesSummary } from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import {
  PENDING_REFERENCE_INTENT_SUMMARY,
  type WorkReference,
} from "@yougan/domain";

export function buildSummarizeReferencesPrompt(input: {
  references: WorkReference[];
  user_message: string;
  added: WorkReference[];
  removed: WorkReference[];
  to_summarize: WorkReference[];
  to_prompt: WorkReference[];
}): string {
  const addedLines = input.added.length
    ? input.added
        .map((r) => `- [${r.id}] ${r.analysis.summary.trim()}`)
        .join("\n")
    : "（无）";
  const removedLines = input.removed.length
    ? input.removed
        .map((r) => `- [${r.id}] ${r.analysis.summary.trim()}`)
        .join("\n")
    : "（无）";
  const summarizeLines = input.to_summarize.length
    ? input.to_summarize
        .map(
          (r) =>
            `- [${r.id}] 分析：${r.analysis.summary.trim()}｜用户说明：${r.intent.user_context?.trim() ?? ""}`,
        )
        .join("\n")
    : "（无）";
  const promptLines = input.to_prompt.length
    ? input.to_prompt
        .map((r) => `- [${r.id}] 分析：${r.analysis.summary.trim()}`)
        .join("\n")
    : "（无）";

  return `归纳参考素材「如何借鉴」并生成面向${YOUGAN_USER_LABEL}的回复。

## 本轮变更
新增：
${addedLines}

删除：
${removedLines}

待归纳 intent（有 user_context）：
${summarizeLines}

待追问借鉴方向（pending 且无 user_context）：
${promptLines}

## ${YOUGAN_USER_LABEL}原话
${input.user_message.trim() || "（无）"}

## 当前参考列表
${profileReferencesSummary(input.references)}

## 输出规则
1. intents 仅包含 to_summarize 与 to_prompt 中的 reference_id
2. 有 user_context 的条目：status=confirmed，summary 为 1–2 句借鉴要点（禁止复述原话）
3. 无 user_context 的 pending 条目：status=pending，summary 固定为「${PENDING_REFERENCE_INTENT_SUMMARY}」
4. reply：说明本轮变更 + 确认已归纳用法 + 对 pending 条目追问借鉴方向；引导在侧栏「参考素材」查看详情
5. 禁止改写 analysis`;
}
