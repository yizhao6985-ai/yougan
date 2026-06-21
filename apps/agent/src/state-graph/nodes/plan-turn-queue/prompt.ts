/** planTurnQueue 用：根据用户最新消息判定 turnQueue kinds */
import { previewHasContent, previewSelectionsSummary } from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { AgentStateType } from "#agent/state.js";
import {
  getPreview,
  getProfile,
  getReferences,
} from "#agent/state-io/index.js";
import { getLatestHumanMessageAttachments, getLatestHumanMessagePreviewSelections, getLatestHumanMessageText } from "#agent/messages/human.js";

export function buildTurnQueuePrompt(
  state: AgentStateType,
  userMessage: string,
): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  const hasPreview = previewHasContent(getPreview(state));
  const hasAttachments =
    getLatestHumanMessageAttachments(state.messages).length > 0;
  const previewSelections = getLatestHumanMessagePreviewSelections(
    state.messages,
  );
  const hasPreviewSelection = previewSelections.length > 0;
  const selectionSummary = previewSelectionsSummary(previewSelections);

  const messageBody = [
    selectionSummary,
    userMessage.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  return `你是回合 workflow 助手。根据${YOUGAN_USER_LABEL}**最新一条消息**，输出本轮**有序队列 kinds**（仅子图路由，不对用户回复）。

## 可选 kind
- **reference**：删/改参考素材本身（有附件时由系统前置，勿输出）
- **profile**：改作品方案（定位/选题/体裁/受众/节拍/边界/记入方案）
- **production**：开写或整稿重写（无 preview 时明确开写；有 preview 时「重写/另写一版/重新开写」）
- **collectRevision**：有成稿时，针对成稿的修改意见（写入改稿清单，**不立刻改稿**）
- **revise**：明确要求**现在执行改稿**（「开始改稿 / 按清单改 / 就这些改吧 / 可以改了」）
- **ask**：纯答疑（不改方案、不改成稿、不开写）

**suggestions** 在 commitTurn 后由系统独立生成，**勿入队**。

## kind 分工速查（有成稿时最易混淆）
| 用户说法 | kind | 说明 |
| 「标题太硬 / 第二段改软一点 / 加个小标题」 | collectRevision | 只记清单 |
| 「开始改稿 / 按刚才说的改 / 就这些改吧」 | revise | 执行改稿 |
| 「重写一版 / 另写一篇 / 不要这篇了重新写」 | production | 整稿重做 |
| 「定位改成职场新人 / 体裁换短视频脚本」 | profile | 改方案，非改成稿 |
| 「小红书标题一般多长？」 | ask | 纯答疑 |

## 有成稿（has_preview=true）
- has_preview_selection=true 且用户补充修改说明 → **collectRevision**
- 针对成稿的润色/改标题/改段落/语气/长度等 → **collectRevision**（除非明确改方案）
- 明确改方案字段 → **profile**
- 要求执行改稿 → **revise**；仅补充意见、未要求执行 → **collectRevision**
- 整稿重写 → **production**
- 纯咨询 → ask

## 无 preview
- 聊方案/补方向/记要求 → profile
- 明确开写/出稿/可以写了 → production
- 纯咨询 → ask

## 附件与 reference
- has_attachments=true：**勿输出 reference**（系统自动前置 preprocess）
- 无附件时，仅当用户删/改参考素材 → reference
- 仅上传附件、无文字：勿输出 reference；默认 **profile**（引导说明借鉴意图），明显纯问文件内容 → ask

## 复合意图
一条消息可同时触发多个 kind（如既改方案又提问）。按 reference → profile → production → collectRevision → revise → ask 排序。

队列至少 1 项。

当前上下文：
- has_preview: ${hasPreview}
- has_attachments: ${hasAttachments}
- has_preview_selection: ${hasPreviewSelection}
- 作品方案：${profileSummary(profile, references)}

${YOUGAN_USER_LABEL}最新一条消息：
${messageBody || (hasAttachments ? "（仅上传参考素材，无文字说明）" : "（空）")}`;
}
