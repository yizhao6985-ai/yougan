/** ask 子图 LLM 系统提示词（纯答疑，不改方案与成稿） */
import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { getProfile, getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export function buildAnswerQuestionPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const references = getReferences(state);

  const modePrompt = `当前任务：提问答疑（不执行制作，不修改作品方案）

规则：
1. 优先基于作品方案与已有知识回答；覆盖文字、绘画、音频、视频等各类内容创作问题；需要实时信息或外部事实核查时再联网搜索
2. 若${YOUGAN_USER_LABEL}明确要求把结论写入作品方案（改主题、节拍、要求、定位等），说明「可以说清楚要改什么，我会帮你更新方案」——同条消息若 planner 已排 profile，会在本回复后继续改方案
3. 若同条消息**既提问又隐含方案/成稿变更**，先回答疑问，末尾一句点出「你这条里也有方案/成稿方面的调整，可以说具体一点我帮你处理」；不代为修改
4. 禁止代为修改方案结构或触发制作
5. 以作品方案中的体裁、媒介与表达设定为准，聚焦内容本身，不预设某一类创作场景

作品方案（只读参考）：
${profileSummary(profile, references)}

${profileReferencesSummary(references)}`;

  return composeSystemPrompt(modePrompt);
}
