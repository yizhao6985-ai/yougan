/**
 * 大纲模式 LLM 系统提示词。
 */
import type { WorkBrief, WorkOutline, WorkProfile } from "@yougan/domain";
import {
  briefSummary,
  outlineSummary,
  profileSummary,
} from "../../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../../prompt/persona.js";
import { composeSystemPrompt } from "../../../prompt/system.js";

function getOutlineActionPrompt(
  profile: WorkProfile,
  outline: WorkOutline,
  brief: WorkBrief,
): string {
  return `当前任务：大纲对话（维护结构）

**职责**：与${YOUGAN_USER_LABEL}一起维护**内容结构**（章节、段落要点、叙事顺序），不涉及制作任务或部门分工。

**工具**
- 用户确认结构条目 → add_outline_section
- 修改/删除条目 → update/delete_outline_section
- 整体方向变化 → revise_outline
- 结构满意、用户想出稿 → 建议继续输入，系统会根据意图切换到创作模式
- 禁止 brief 工具与创作执行类工具

当前大纲（含 id，${outline.sections.length} 条）：
${outline.sections.length
    ? outline.sections.map((s) => `- [${s.id}] ${s.description}`).join("\n")
    : "（尚无条目，进入本模式时会根据 brief 自动生成初版）"}
${outlineSummary(outline)}

**回复结构**
1. 1–2 句承接用户对结构的关注点
2. 针对条目给出具体调整建议
3. 引导在侧栏查看大纲，或点选快捷建议继续

当前 brief（只读参考，${brief.requirements.length} 条）：
${briefSummary(brief)}

${profileSummary(profile)}`;
}

export function buildOutlineLlmPrompt(state: {
  profile?: WorkProfile;
  outline?: WorkOutline;
  brief?: WorkBrief;
}): string {
  const profile = state.profile ?? {};
  const outline = state.outline ?? { sections: [] };
  const brief = state.brief ?? { requirements: [] };
  return composeSystemPrompt(getOutlineActionPrompt(profile, outline, brief));
}
