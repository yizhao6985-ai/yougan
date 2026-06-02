import {
  briefSummary,
  productionPlanSummary,
  profileSummary,
} from "../../prompt/context.js";
import { YOUGAN_USER_LABEL } from "../../prompt/persona.js";
import type { ChatMode } from "../../schema.js";
import type { AgentStateType } from "../../state.js";
import {
  parseBrief,
  parseMode,
  parseProductionPlan,
  parseProfile,
} from "../../lib/parse-agent-state.js";
import { CONVERSATION_RECOMMENDATIONS_COUNT } from "./schema.js";

const MODE_LABELS: Record<ChatMode, string> = {
  inspiration: "灵感模式（探索创作方向）",
  ask: "提问模式（答疑与说明）",
  creation: "创作模式（执行制作计划）",
};

function modeGuidance(mode: ChatMode): string {
  switch (mode) {
    case "inspiration":
      return `建议应帮助${YOUGAN_USER_LABEL}从对话主题出发，探索平台、受众、选题或写法；以 explore 为主，可含 1 条 navigate。`;
    case "ask":
      return `建议应是${YOUGAN_USER_LABEL}可能想直接提问的完整句子，聚焦优化建议、创作方法或行业/平台背景；kind 用 explore。`;
    case "creation":
      return `建议应引导${YOUGAN_USER_LABEL}开始或继续制作（如生成成稿、调整计划、修改语气）；若作品已有制作计划，可结合 pending 任务。`;
    default:
      return "";
  }
}

export function buildOpeningSuggestionsPrompt(state: AgentStateType): string {
  const mode = parseMode(state);
  const profile = parseProfile(state);
  const brief = parseBrief(state);
  const plan = parseProductionPlan(state);
  const workTitle = state.workTitle?.trim() || "（未命名作品）";
  const conversationTitle = state.conversationTitle?.trim() || "（未命名对话）";

  const workContext = [
    `作品标题：${workTitle}`,
    `作品特征：${profileSummary(profile)}`,
    `当前 brief：${briefSummary(brief)}`,
    `制作计划：${productionPlanSummary(plan)}`,
  ].join("\n");

  return `你是「有感 Yougan」创作搭子。${YOUGAN_USER_LABEL}刚新建一条对话，thread 尚无消息。请根据对话标题、当前模式与作品上下文，生成 ${CONVERSATION_RECOMMENDATIONS_COUNT} 条开场可点击建议。

当前模式：${MODE_LABELS[mode]}
对话标题：${conversationTitle}

作品上下文（同作品下其他对话可能已沉淀的数据，供参考）：
${workContext}

${modeGuidance(mode)}

要求：
- 恰好 ${CONVERSATION_RECOMMENDATIONS_COUNT} 条，互斥、可执行、口语化中文，像${YOUGAN_USER_LABEL}自己会说的话
- label 简短（≤8 字），message 是用户点击后直接发送的完整句子
- 结合对话标题；若作品已有 brief/计划，可承接而非重复空泛开场；禁止客服腔和空泛套话
- 禁止「补充想法 / 我还有其他想法 / 自由输入」类兜底选项；若需引导自由表达，写在 hint 而非 suggestions`;
}
