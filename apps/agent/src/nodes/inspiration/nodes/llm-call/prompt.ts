/**
 * 灵感模式 LLM 节点系统提示词（仅 brief 收集，不含大纲）。
 */
import type { WorkBrief, WorkProfile } from "@yougan/domain";
import { briefSummary, profileSummary } from "../../../../prompt/context.js"
import { composeSystemPrompt } from "../../../../prompt/system.js"

function getInspirationActionPrompt(profile: WorkProfile, brief: WorkBrief): string {
  return `当前任务：灵感对话（对齐 brief）

**当前阶段：灵感收集**
- 探索方向，用户明确确认后 → add_brief_requirement
- 用户想讨论内容结构/大纲 → 建议其继续输入，系统会根据意图切换到大纲模式
- 禁止 outline 工具与创作执行类工具

**回复结构**
1. 1–2 句承接用户关注点
2. 2–4 个具体可能性（方案/优劣/风险）
3. 结尾引导点选快捷选项或继续输入

当前 brief（含 id，${brief.requirements.length} 条）：
${brief.requirements.length
    ? brief.requirements.map((r) => `- [${r.id}] ${r.description}`).join("\n")
    : "（尚无）"}

${profileSummary(profile)}`;
}

export function buildInspirationLlmPrompt(state: {
  profile?: WorkProfile;
  brief?: WorkBrief;
}): string {
  const profile = state.profile ?? {};
  const brief = state.brief ?? { requirements: [] };
  return composeSystemPrompt(getInspirationActionPrompt(profile, brief));
}
