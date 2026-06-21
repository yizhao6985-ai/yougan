/** collectRevision：从用户消息提取成稿改稿意见 */
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";

export function buildCollectRevisionSystemPrompt(): string {
  return composeSystemPrompt(`当前任务：从${YOUGAN_USER_LABEL}消息中提取针对**当前成稿**的改稿意见（写入改稿清单，本回合不改动成稿）。

规则：
1. **instruction**：改稿要求，简洁明确；同条消息有多处修改时，合并为一条 instruction（用分号分隔）
2. **quote**：若消息引用成稿原文（划词、引号、「这段/第二段」等），提取最相关的原文片段；无明确引用则 null
3. 只提取**针对成稿**的修改（标题、段落、语气、长度、配图等）；若明显是在改方案/定位/体裁，instruction 留空或仅记录成稿相关部分
4. 「开始改稿 / 按清单改 / 就这些改吧」等**执行改稿**指令由 revise 流程处理；本节点仍如实记录 instruction

示例：
- 「标题太硬，软一点」→ instruction=标题语气改软，quote=null
- 「把『年轻人就要吃苦』这句删掉」→ quote=年轻人就要吃苦
- 「定位改成职场新人」→ 属方案变更，非成稿修改（本 kind 不应出现，若误入则 instruction 尽量为空）`);
}

export function buildCollectRevisionHumanPrompt(input: {
  previewText: string;
  userMessage: string;
}): string {
  return `当前成稿摘要：
${input.previewText || "（无正文）"}

${YOUGAN_USER_LABEL}消息：
${input.userMessage}`;
}
