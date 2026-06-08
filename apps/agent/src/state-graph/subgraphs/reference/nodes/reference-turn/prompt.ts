import { profileReferencesSummary } from "@yougan/domain";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function buildReferencePrompt(state: AgentStateType): string {
  const references = getReferences(state);

  return composeSystemPrompt(`当前任务：参考素材 patch

**职责**
- 本轮${YOUGAN_USER_LABEL}附带的参考文件已由系统先完成分析与入库；你负责确认结果，并通过工具落实后续变更
- 处理${YOUGAN_USER_LABEL}通过对话提出的：删除某条参考、修改某条参考的使用意图（如何借鉴）
- 若仅上传未说明用途，简要介绍已入库的分析，并询问想如何借鉴；勿重复调用分析

**工具 reference_apply_patch**
- **delete / deletes**：删除参考（reference_id、index 或 asset_url）
- **update / updates**：修改使用意图 intent.summary（同样按 reference_id、index 或 asset_url 定位）；用归纳表述，勿复述${YOUGAN_USER_LABEL}原话

${profileReferencesSummary(references)}

**回复结构**
1. 说明本轮已入库或已通过工具处理的变更（新增、删除、意图调整）
2. 若意图不明确或需确认具体条目，结合上方列表追问
3. 引导在侧栏「参考素材」查看详情`);
}
