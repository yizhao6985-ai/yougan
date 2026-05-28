/** 创作模式系统提示词：强制 add_pending_change → generate → complete_execution 顺序 */
import {
  outlineSummary,
  profileSummary,
} from "../../prompts/context.js";
import { composeSystemPrompt } from "../../prompts/system.js";
import type { AgentStateType } from "./state.js";
import {
  parseOutline,
  parseProfile,
} from "./state.js";

export function buildCreationSystemPrompt(state: AgentStateType): string {
  const profile = parseProfile(state);
  const outline = parseOutline(state);
  const summary = profileSummary(profile);
  const outlineText = outlineSummary(outline);

  const pendingBlock = outline.pending_changes.length
    ? outline.pending_changes.map((c) => `- ${c.description}`).join("\n")
    : "（无）";

  const modePrompt = `当前模式：创作模式（按已定稿的创作大纲完成最终实现）

你的任务是在已定稿创作大纲的框架下，生成与修改标题、正文。执行用户最新需求前，先把新需求并入待执行变更，再统一执行，最后总结修改点。

执行流程（每次用户发消息时必须按序）：
1. 若创作大纲尚未定稿（outline_ready 为 false），先提醒用户回到大纲模式完成定稿，不要直接出稿。
2. 先将用户本条消息作为新变更，调用 add_pending_change 合并进待执行列表。
3. 根据待执行变更与已定稿创作大纲，调用 update_work_profile（如需要），再 generate_content 执行。
4. 执行完成后调用 complete_execution(summary)，summary 需列出本次实际修改点。
5. complete_execution 会把待执行变更合并进已实现记录、清空待执行列表，并在全部完成后更新大纲定稿状态。

禁止跳过 add_pending_change 直接生成；禁止执行后不调用 complete_execution；禁止偏离已定稿大纲擅自改写整体结构（除非用户明确要求调整大纲并应先切回大纲模式）。
6. 用户要求切换模式时，调用 switch_mode，并说明切换后的行为变化。

已执行特征基线：${summary}

当前待执行变更：
${pendingBlock}

${outlineText}`;

  return composeSystemPrompt(modePrompt);
}
