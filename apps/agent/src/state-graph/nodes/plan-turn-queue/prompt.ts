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

  return `你是回合 workflow 助手。根据${YOUGAN_USER_LABEL}**最新一条消息**，输出本轮**有序队列 kinds**。

## 可选 kind
- **reference**：改参考素材本身
- **profile**：改作品方案（须**明确**改方案/定位/体裁/受众/节拍/边界/记入方案）
- **production**：开写或整稿重写（无 preview 或明确要求重写/另写一版/开写）
- **collectRevision**：有成稿时，针对成稿的修改意见（写入改稿清单，不立刻改稿）
- **revise**：用户在对话中明确要求执行改稿（如「开始改稿 / 按清单改 / 就这些改吧 / 可以改了」）
- **ask**：纯答疑

**suggestions** 由系统自动追加，勿输出。

## 有成稿（has_preview=true）时的默认规则
- 消息含 **preview_selection**（has_preview_selection=true）且用户补充了修改说明 → **collectRevision**
- 修改/润色/改标题/改段落/语气/太短等**针对成稿**的表述 → **collectRevision**（除非明确改方案）
- **仅当明确改方案**（方案/定位/选题/体裁/受众/节拍/边界/记入方案）→ **profile**
- **开始改稿 / 按清单改 / 就这些改吧 / 可以改了** 等执行改稿的指令 → **revise**（仅补充修改意见、未要求执行 → collectRevision）
- **重写 / 另写一版 / 重新开写** → **production**
- 纯咨询 → ask

## 无 preview 时
- 讨论方案 → profile
- 明确开写/出稿 → production
- 纯咨询 → ask

## reference 入队规则
- has_attachments=true：系统自动前置 reference，勿输出 reference
- 删/改参考素材 → reference

同时涉及多层时，按 reference → profile → production → collectRevision → revise 排序。

队列至少 1 项。

当前上下文：
- has_preview: ${hasPreview}
- has_attachments: ${hasAttachments}
- has_preview_selection: ${hasPreviewSelection}
- 作品方案：${profileSummary(profile, references)}

${YOUGAN_USER_LABEL}最新一条消息：
${messageBody || (hasAttachments ? "（仅上传参考素材，无文字说明）" : "（空）")}`;
}
