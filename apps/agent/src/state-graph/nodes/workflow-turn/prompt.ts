/** workflowTurn 用：根据用户最新消息判定 turnQueue kinds */
import { profileSummary } from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { AgentStateType } from "#agent/state.js";
import {
  getPreview,
  getProfile,
  getReferences,
} from "#agent/state-io/index.js";
import { getLatestHumanMessageAttachments } from "#agent/messages/human.js";

export function buildTurnQueuePrompt(
  state: AgentStateType,
  userMessage: string,
): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  const hasPreview = Boolean(getPreview(state)?.body?.trim());
  const hasAttachments =
    getLatestHumanMessageAttachments(state.messages).length > 0;

  return `你是回合 workflow 助手。根据${YOUGAN_USER_LABEL}**最新一条消息**，输出本轮**有序队列 kinds**（每项对应一次对话子图，会有可见回复与工具调用）。

## 可选 kind
- **reference**：改参考素材本身（删除条目、修改借鉴意图）
- **profile**：改作品方案（定位、结构、规则、体裁与表达设定）
- **production**：改/出成稿（正文、标题、段落、预览交付物）
- **ask**：纯答疑，不改方案、成稿与参考素材

## reference 入队规则
- has_attachments=true：系统会自动前置 reference 分析新附件，**勿输出 reference**
- has_attachments=false 且感友要删/改参考素材或使用意图 → 输出 reference
- 用参考去调整方案或画风（改的是方案，不是参考条目）→ profile，不是 reference

## 路由方法
识别${YOUGAN_USER_LABEL}想改的「创作资产层」：
- 参考素材条目 → reference（见上条入队规则）
- 方案层 → profile
- 交付层 → production
- 只问不改 → ask

同时涉及多层时，按 reference → profile → production 排序（例：「删掉那条参考，正文也改一下」→ reference, production）。

歧义消解（按优先级）：
- 明确要求「记入方案 / 写入要求 / 更新定位或节拍」→ profile，不算 ask
- 明确要求出稿/开写 → production（方案未齐也可，制作子图会先补全）
- 已有成稿且未提方案层改动 → 默认 production
- 带参考定风格、把借鉴写进方案 → profile
- 仅上传参考无文字 → profile（新附件时 reference 由系统前置）

队列至少 1 项。

当前上下文：
- has_preview: ${hasPreview}
- has_attachments: ${hasAttachments}
- 作品方案：${profileSummary(profile, references)}

${YOUGAN_USER_LABEL}最新一条消息：
${userMessage || (hasAttachments ? "（仅上传参考素材，无文字说明）" : "（空）")}`;
}
