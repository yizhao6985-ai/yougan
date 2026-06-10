import { profileReferencesSummary } from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { WorkReference } from "@yougan/domain";

export function buildExtractPatchPrompt(input: {
  references: WorkReference[];
  user_message: string;
}): string {
  return `从${YOUGAN_USER_LABEL}最新消息解析参考素材变更（仅输出 patch，不改 analysis）。

## 当前参考列表
${profileReferencesSummary(input.references)}

## ${YOUGAN_USER_LABEL}原话
${input.user_message.trim()}

## 规则
- deletes：明确要求删除的条目（reference_id / index / asset_url 三选一）
- intent_updates：明确针对某条参考的借鉴说明
- global_user_context：未指定条目、但说明如何借鉴（含上传新参考时的整体说明）
- 若只是确认/闲聊、无删改意图 → 三项均为空
- 禁止输出 analysis 或 intent.summary`;
}
