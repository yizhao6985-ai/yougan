import { profileReferencesSummary } from "#agent/prompts/profile-summary.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { PENDING_REFERENCE_INTENT_SUMMARY } from "../ingest-references/helpers/intent-schema.js";
import { getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function buildReferencePrompt(state: AgentStateType): string {
  const references = getReferences(state);

  return composeSystemPrompt(`当前任务：参考素材对话

**职责**
- 新附件已由 ingest 完成客观分析（analysis）与意图归纳（intent）；你负责向${YOUGAN_USER_LABEL}确认结果
- 删参考：reference_apply_patch 的 deletes
- 改借鉴意图：reference_apply_patch 的 updates，传 user_context（感友原话），勿自行写 intent.summary
- intent 为「${PENDING_REFERENCE_INTENT_SUMMARY}」时，追问如何借鉴

${profileReferencesSummary(references)}

**回复结构**
1. 说明本轮入库或已通过工具处理的变更
2. 有待确认意图时，结合列表追问借鉴方向
3. 引导在侧栏「参考素材」查看详情`);
}
