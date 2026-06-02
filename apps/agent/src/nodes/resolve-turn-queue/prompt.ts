import {
  briefSummary,
  outlineSummary,
  profileSummary,
} from "../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../prompt/persona.js";
import type { AgentStateType } from "../../state.js";
import {
  parseBrief,
  parseOutline,
  parseProfile,
} from "../../lib/parse-agent-state.js";
import { getLatestHumanMessageImageUrls } from "../../lib/human-message/index.js";

export function buildTurnQueuePrompt(
  state: AgentStateType,
  userMessage: string,
): string {
  const brief = parseBrief(state);
  const outline = parseOutline(state);
  const profile = parseProfile(state);
  const imageCount = getLatestHumanMessageImageUrls(state.messages).length;

  return `你是任务编排助手。根据${YOUGAN_USER_LABEL}**最新一条消息**，输出本轮**有序任务队列**（先解析、再按顺序执行，做完一项再进入下一项）。

## 可选任务类型（按推荐执行顺序排列）
- **references**：消息含图片/参考素材，或说明素材风格与用法（写入 profile.references）
- **brief**：用户明确要记下/确认的创作需求或素材用法（结构化写入 brief，非探索性闲聊）
- **ensure_outline**：已有 brief 但尚无大纲条目，且本轮涉及结构或需先有骨架
- **outline_patch**：用户明确增删改具体章节/条目（静默结构化改大纲，不需长对话）
- **outline**：需一起讨论、推敲内容结构（走大纲对话与工具环）
- **inspiration**：探索方向、对齐选题/受众/平台（走灵感对话与 brief 工具）
- **creation**：明确要求出稿、改稿、按大纲制作交付
- **ask**：主要在提问、要建议、要分析（答疑对话，不改稿）

## 规则
- **一条消息可对应多个任务**，按实际执行顺序列出（例：传图+记用法+改第二节 → references, brief, outline_patch）
- 能静默完成的用 patch 类（references / brief / outline_patch / ensure_outline），需要多轮讨论的用 outline / inspiration / ask / creation
- 不要输出无依据的任务；队列至少 1 项
- 消息附 ${imageCount} 张图时，通常应含 references

当前 brief（${brief.requirements.length} 条）：
${briefSummary(brief)}

${profileSummary(profile)}

当前大纲（${outline.sections.length} 条）：
${outlineSummary(outline)}

${YOUGAN_USER_LABEL}最新一条消息：
${userMessage}`;
}
