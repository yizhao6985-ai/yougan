/** planTurnQueue 用：根据用户最新消息判定 turnQueue kinds */
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

**suggestions** 由系统在队尾自动追加，勿输出。

## reference 入队规则
- has_attachments=true：系统会自动前置 reference 子图分析新附件，**勿输出 reference**
- has_attachments=false 且感友要删/改参考素材或使用意图 → 输出 reference
- 用参考去调整方案或画风（改的是方案，不是参考条目）→ profile，不是 reference

## 路由方法
识别${YOUGAN_USER_LABEL}想改的「创作资产层」：
- 参考素材条目 → reference（见上条入队规则）
- 方案层 → profile
- 交付层（成稿/预览）→ production（见下条**严格**规则）
- 只问不改 → ask

同时涉及多层时，按 reference → profile → production 排序（例：「定位改一下，然后出稿」→ profile, production）。

## production 入队规则（严格，宁缺勿滥）
**仅当**感友**明确要求开始或修改成稿/预览交付物**时才输出 production。须命中以下之一：
- **开写出稿**：开始制作、开写、出稿、生成正文/成稿、写一版、直接写、按方案制作
- **改稿**：改正文、改标题、改段落/开头、重写预览、润色成稿、把正文…
- **继续制作**：继续写、接着写、再出一版

以下**一律 profile**，**不要** production（即使 has_preview=true）：
- 讨论/补充/调整方案：定位、主题、体裁、媒介、受众、语气、结构、规则、设定、参考借鉴方式
- 描述想做什么但未明确要求出稿：「帮我写个…」「想做个…」「关于…的内容」「小红书笔记讲…」
- 上传参考后说明方向/风格（reference 由系统前置时，后续队列用 profile）
- 对方案提要求、聊选题、确认方向、补充约束
- **不确定本轮是否该出稿 → 只输出 profile**

## 歧义消解（按优先级）
- 明确要求「记入方案 / 写入要求 / 更新定位或节拍」→ profile
- 纯咨询、问方法/背景、不要求改状态 → ask
- 明确要求出稿/开写/改稿 → production（可单独 production，或与 profile 组合）
- 带参考定风格、把借鉴写进方案 → profile
- 仅上传参考无文字 → profile（新附件时 reference 由系统前置）
- **禁止**因 has_preview=true 就默认 production

队列至少 1 项。

当前上下文：
- has_preview: ${hasPreview}（仅表示是否已有成稿，**不能**作为本轮走 production 的默认依据）
- has_attachments: ${hasAttachments}
- 作品方案：${profileSummary(profile, references)}

${YOUGAN_USER_LABEL}最新一条消息：
${userMessage || (hasAttachments ? "（仅上传参考素材，无文字说明）" : "（空）")}`;
}
