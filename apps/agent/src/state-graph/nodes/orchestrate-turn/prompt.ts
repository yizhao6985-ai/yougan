/** orchestrateTurn 用：根据用户最新消息判定 turnQueue kinds */
import { profileReferencesSummary, profileSummary } from "@yougan/domain";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { AgentStateType } from "#agent/state.js";
import { getPreview, getProfile, getReferences } from "#agent/state-io/index.js";
import { getLatestHumanMessageAttachments } from "#agent/messages/human.js";

export function buildTurnQueuePrompt(
  state: AgentStateType,
  userMessage: string,
): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  const hasPreview = Boolean(getPreview(state)?.body?.trim());
  const attachmentCount = getLatestHumanMessageAttachments(state.messages).length;

  return `你是回合编排助手。根据${YOUGAN_USER_LABEL}**最新一条消息**，输出本轮**有序队列 kinds**（每项对应一次对话子图，会有可见回复与工具调用）。

## 可选队列项（系统会按固定顺序排序；带附件时 reference 会自动置前）
- **reference**：参考素材入库与分析（系统子图；带附件且非纯 ask 时自动前置，无需手动输出）
- **profile**：修改**作品方案**（创作主题、体裁形式、受众语气、定位、写作要求、内容节拍/结构）
- **production**：修改**作品成稿**（标题、正文、语气润色、出稿、改稿、按方案制作交付）
- **ask**：主要在提问、要分析（纯答疑，不改方案与成稿；仅看图讨论、不入库时可单独 ask）

## 意图判定（看用户描述的修改对象 / 宾语）
- 宾语是**方案 / 结构 / 节拍 / 章节 / 体裁 / 主题 / 受众 / 定位 / 要求** → profile
- 明确要求**记入方案 / 写入要求 / 更新定位或节拍**（即便措辞像问答结论）→ profile，不要 ask
- 宾语是**作品 / 成稿 / 正文 / 标题 / 段落 / 文案 / 预览** → production
- 用户直接要求出稿/开写，**即使方案未齐也可 production**（制作子图会先补全缺口）
- 已有成稿（has_preview=${hasPreview}）且未明确动方案时，**默认 production**（当成稿修订）
- 复合意图：先 profile 后 production（例：「第二节改讲性价比，正文也一起改」→ profile, production）
- 只讨论方案、无出稿/改稿动词 → 不要 production
- 传参考素材定风格 → profile（reference 子图会先分析附件）
- 仅上传参考素材无文字 → profile
- 只使用 profile / production / ask 三种 kind 做意图判断（不要输出 reference）；队列至少 1 项

当前作品方案：
${profileSummary(profile, references)}

${profileReferencesSummary(references)}

${YOUGAN_USER_LABEL}最新一条消息：
${userMessage || (attachmentCount > 0 ? "（仅上传参考素材，无文字说明）" : "（空）")}`;
}
