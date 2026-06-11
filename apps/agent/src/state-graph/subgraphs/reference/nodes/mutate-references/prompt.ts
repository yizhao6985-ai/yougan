import { profileReferencesSummary } from "#agent/prompts/profile-summary.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getLatestHumanMessageText } from "#agent/messages/human.js";
import { getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function buildMutateReferencesPrompt(state: AgentStateType): string {
  const references = getReferences(state);
  const userMessage = getLatestHumanMessageText(state.messages).trim();

  const modePrompt = `当前任务：按${YOUGAN_USER_LABEL}意图修改参考素材（不写 analysis、不写 intent.summary）

**职责**：解析最新消息中的删改意图，通过原子工具写入 staging.references；每条工具只做一件事。

**工具**
- delete_reference：删除一条参考（reference_id / index / asset_url 三选一）
- update_reference_intent：为指定参考写入借鉴说明（user_context，后续节点会归纳 summary）
- set_pending_references_context：未指定条目时，为所有 pending 及本轮新上传参考写入统一借鉴说明

**规则**
- 删、改可组合；每种意图分别调用对应工具，可一轮多次 tool_call
- 明确针对某条 → update_reference_intent；笼统说明借鉴方式 → set_pending_references_context
- 若只是确认/闲聊、无删改意图 → 不调用工具，简短说明无变更即可
- 禁止修改 analysis；禁止直接写 intent.summary
- 禁止向${YOUGAN_USER_LABEL}做完整回合回复（后续 summarize 节点负责）

当前参考列表：
${profileReferencesSummary(references)}

${YOUGAN_USER_LABEL}最新消息：
${userMessage || "（无文字）"}`;

  return composeSystemPrompt(modePrompt);
}
