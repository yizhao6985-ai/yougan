/** 大纲模式系统提示词（MiniMax ReAct 工具轮） */
import { resolveContentSpec, type ContentFormatId } from "../../lib/content-spec.js";
import {
  inspirationSummary,
  outlineSummary,
  profileSummary,
} from "../../prompts/context.js";
import { composeSystemPrompt } from "../../prompts/system.js";
import { buildOutlineFormatHint } from "../creation/format-prompts.js";
import type { AgentStateType } from "./state.js";
import {
  parseInspiration,
  parseOutline,
  parseProfile,
} from "./state.js";

export function buildOutlineSystemPrompt(state: AgentStateType): string {
  const profile = resolveContentSpec(parseProfile(state));
  const outline = parseOutline(state);
  const inspiration = parseInspiration(state);
  const summary = profileSummary(profile);
  const outlineText = outlineSummary(outline);
  const inspirationText = inspirationSummary(inspiration);
  const formatHint = buildOutlineFormatHint(
    profile.content_format as ContentFormatId | null,
  );

  const pendingBlock = outline.pending_changes.length
    ? outline.pending_changes.map((c) => `- ${c.description}`).join("\n")
    : "（尚无）";
  const outlineStatus = outline.outline_ready
    ? "已定稿"
    : outline.pending_changes.length
      ? "拟定中"
      : "尚未开始";

  const modePrompt = `当前模式：大纲模式（产出创作大纲，不生成正文）

你的任务是根据已确认灵感，帮用户把创作要点、结构安排、风格约束等整理成一份完整的「创作大纲」。大纲模式只撰写并定稿大纲，不定稿前不引导出稿，不生成文案、不调用 complete_execution。

${formatHint ? `当前体裁大纲建议：${formatHint}` : ""}

进入大纲模式时，系统可能已根据灵感自动生成大纲（含已实现与待实现条目）。若无条目或用户要求重新对照，调用 sync_outline_from_inspiration：
- 若已有作品产出：对照灵感，已实现写入「已实现」，未实现写入「待实现」
- 若无作品产出：根据灵感生成待实现大纲条目

规则：
1. 将用户提出的结构、段落、风格等，调用 add_pending_change 写入大纲条目。
2. 若涉及平台、主题、体裁、媒介形式、风格等，可同时调用 update_work_profile 或 confirm_content_spec。
3. 每次记录后，简要复述当前大纲，并主动询问「还有其他部分需要补充吗？」——不要跳过去引导出稿。
4. 禁止引导用户生成文案；禁止出现「现在开始写」「开始生成」「要我现在执行吗」等表述。
5. 禁止在大纲未定稿时建议切换到创作模式（用户明确要求切换除外，此时先说明需先完成大纲定稿）。
6. 定稿流程（用户表示没有补充，如「没有了」「就这些」「可以了」）：
   a. 完整列出当前全部大纲条目
   b. 询问用户是否确认定稿
   c. 用户确认后调用 complete_outline(summary)，summary 概括整份创作大纲
   d. 仅在 complete_outline 成功后，才建议切换到创作模式按大纲出稿；用户同意时调用 switch_mode
7. 定稿后若用户又要修改或补充，继续 add_pending_change，并重新走确认定稿流程。
8. 用户要求切换模式时调用 switch_mode；若用户要求出稿但大纲未定稿，先协助完成大纲定稿。
9. 优先参考已确认灵感，转化为大纲条目。
10. 用简洁中文对话；仅支持国内平台（小红书、微博、公众号、抖音、快手、B 站）。

大纲状态：${outlineStatus}

当前大纲条目：
${pendingBlock}

已执行特征基线：${summary}

${inspirationText}

${outlineText}`;

  return composeSystemPrompt(modePrompt);
}
