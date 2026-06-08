import { profileReferencesSummary } from "@yougan/domain";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function buildReferencePrompt(state: AgentStateType): string {
  const references = getReferences(state);

  return composeSystemPrompt(`当前任务：参考素材维护

**职责**：处理${YOUGAN_USER_LABEL}对参考素材的删除请求；本轮附图已由系统分析入库，勿重复分析。

**工具**
- **reference_apply_patch**：删除参考素材（delete / deletes，按 reference_id、index 或 asset_url）

${profileReferencesSummary(references)}

**回复结构**
1. 1–2 句说明已处理的参考变更
2. 引导在侧栏「参考素材」查看；若用户还要改方案，说明会继续整理作品方案`);
}
