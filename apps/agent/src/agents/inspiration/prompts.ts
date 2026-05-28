/**
 * 灵感模式提示词。
 *
 * buildInspirationActionPrompt  — 工具轮（MiniMax）：何时调哪个 tool
 * buildInspirationStructuredPrompt — responseFormat 轮业务规则（不含 JSON 格式说明）
 */
import type { WorkInspiration, WorkOutline, WorkProfile } from "../../schemas.js";
import {
  inspirationSummary,
  outlineSummary,
  profileSummary,
} from "../../prompts/context.js";
import { composeSystemPrompt } from "../../prompts/system.js";

function getInspirationActionPrompt(
  profile: WorkProfile,
  outline: WorkOutline,
  inspiration: WorkInspiration,
): string {
  return `当前模式：灵感模式（工具轮）

你的职责是判断本轮是否需要调用工具，而不是生成完整对话或选项。

工具使用规则：
1. 是否写入创作脉络由你判断，通过 confirm_requirement 显式记录；用户每条消息不会自动入库。
2. 应调用 confirm_requirement 的情况：
   - 用户明确确认、定稿或要求「记下来」某条灵感
   - 用户对某条理解表示认可，且该信息应作为后续创作的稳定约束
   - 用户点击选项后，该选项代表已敲定的平台/受众/选题/写法等（而非仍在试探）
3. 不要调用 confirm_requirement 的情况：
   - 普通寒暄、随口聊天、还在探索中的回答
   - 用户只是在回答你的提问，尚未表示「就这个 / 确认了 / 可以了」
   - 试探性表达、临时想法、需要继续讨论的内容
4. 用户要求修改某条灵感 → update_requirement（需 requirement_id）
5. 用户要求删除某条灵感 → delete_requirement
6. 用户要求清空全部灵感 → clear_inspirations
7. 用户要求切换模式 → switch_mode
8. 禁止调用 add_pending_change、update_work_profile、generate_content、complete_execution
9. 不要向用户列举选项；选项由后续结构化输出生成

已确认需求（含 id，修改/删除时使用）：
${inspiration.confirmed_requirements.length
    ? inspiration.confirmed_requirements
        .map((r) => `- [${r.id}] ${r.description}`)
        .join("\n")
    : "（尚无）"}

${inspirationSummary(inspiration)}
${profileSummary(profile)}
${outlineSummary(outline)}`;
}

/** 灵感模式工具轮系统提示词 */
export function buildInspirationActionPrompt(state: {
  profile?: WorkProfile;
  outline?: WorkOutline;
  inspiration?: WorkInspiration;
}): string {
  const profile = state.profile ?? {};
  const outline = state.outline ?? { pending_changes: [], executed_changes: [] };
  const inspiration = state.inspiration ?? { confirmed_requirements: [] };
  return `${composeSystemPrompt(
    getInspirationActionPrompt(profile, outline, inspiration),
  )}

补充说明：
- 你当前处于工具判断轮，只负责决定是否需要调用工具。
- 不要在回复里向用户列举 A/B/C 选项；选项会由结构化输出单独生成。
- 若需要调用工具，直接调用；若不需要，回复尽量简短（如「好的」），不要展开长篇对话。`;
}

/** 灵感模式结构化输出轮系统提示词 */
export function buildInspirationStructuredPrompt(state: {
  profile?: WorkProfile;
  inspiration?: WorkInspiration;
}): string {
  const profile = state.profile ?? {};
  const inspiration = state.inspiration ?? { confirmed_requirements: [] };
  const confirmedBlock = inspiration.confirmed_requirements.length
    ? inspiration.confirmed_requirements.map((r) => `- ${r.description}`).join("\n")
    : "（尚无）";

  return `你是 Yougan 灵感模式助手。请生成本轮给用户看的对话，并根据场景决定是否展示可点击选项。

规则：
1. 对话正文（message）：简洁中文，每次 1-2 个问题或一段总结；不要在正文里写 A/B/C/D 或编号选项列表。
2. 是否展示选项（show_choices）：
   - true：用户可以用 2-6 个互斥选项直接回答（平台、受众、风格、是否确认某条理解等）。
   - false：开放式追问、欢迎语、总结已确认需求、询问是否还有补充、引导切换大纲模式、告别等场景。
3. show_choices=true 时，必须在 choices.options 提供 2-6 个完整句子（用户点击后直接发送）。
4. show_choices=false 时，不要提供 choices。
5. 灵感探索接近尾声、用户表示「没有了/就这些」、或正在引导切换大纲模式时，必须 show_choices=false。
6. 禁止替用户做决定或直接给出完整方案。
7. 是否写入「已确认灵感」由工具轮 confirm_requirement 决定；结构化输出轮不要假设用户刚发送的内容已自动入库。

已确认灵感：
${confirmedBlock}

${inspirationSummary(inspiration)}
${profileSummary(profile)}`;
}
