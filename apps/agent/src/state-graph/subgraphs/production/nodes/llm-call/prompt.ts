/** production 文案管线 LLM 系统提示词 */
import { departmentsBrief } from "../spawn-specialist/helpers/department-brief.js";
import {
  getPlanSummary,
  isPlanReady,
  isProfileActionable,
  resolveDeliveryFromProfile,
  type ContentFormatId,
  type ProfileDelivery,
} from "@yougan/domain";
import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import { productionPlanSummary } from "../schedule-production/helpers/plan-prompt.js";
import {
  composeSystemPrompt,
  YOUGAN_USER_LABEL,
} from "#agent/system-prompt.js";
import { buildFormatGenerationGuidance } from "./format-guidance.js";
import {
  getProductionPlan,
  getProfile,
  getReferences,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

const PLATFORM_INDUSTRY: Record<string, string> = {
  xiaohongshu:
    "小红书：真实体验感、封面与标题决定点击率；种草需具体场景与对比；避免硬广感；话题标签 3-5 个为宜。",
  weibo:
    "微博：热点借势、短句传播；适合观点输出与话题讨论；注意 140 字内核心信息。",
  wechat:
    "微信公众号：深度与结构并重；标题决定打开率；适合分节小标题与金句；注意排版留白。",
  douyin:
    "抖音：前 3 秒钩子决定完播；口播口语化；节奏快、信息密度高；结尾引导互动。",
  kuaishou:
    "快手：下沉市场、真实接地气；强调人情味与信任感；适合故事化叙述。",
  bilibili:
    "哔哩哔哩：年轻受众、玩梗与干货并存；适合系列化与 UP 主人设；注意弹幕文化。",
};

const FORMAT_INDUSTRY: Record<string, string> = {
  note: "笔记体裁：短平快、分点清晰、emoji 适度、行动号召明确。",
  article: "长文体裁：论点—论据—案例—总结；小标题分段；适合深度种草或科普。",
  illustration:
    "绘画体裁：画面即主交付；明确风格流派、构图、光影、色彩与主体细节；文生图提示词需具体可执行。",
  short_video: "短视频：分镜思维、口播脚本、字幕要点、BGM 情绪配合。",
  video_script: "视频脚本：镜头语言 + 旁白 + 画面描述；注意转场与节奏。",
  podcast: "播客/音频：对话感或独白；分段主题；适合通勤场景收听。",
  music: "音乐/歌词：情绪基调、段落结构、押韵与记忆点。",
};

const MODALITY_INDUSTRY: Record<string, string> = {
  image:
    "图片媒介：可为独立绘画（仅 image）或图文组合（text + image）；前者走设计管线，后者文案为主。",
};

/** 根据平台、体裁、媒介拼行业经验段落 */
export function resolveIndustryContext(delivery: ProfileDelivery): string {
  const parts: string[] = [];

  const platform = delivery.platform?.trim().toLowerCase();
  if (platform && PLATFORM_INDUSTRY[platform]) {
    parts.push(PLATFORM_INDUSTRY[platform]);
  }

  const format = delivery.format?.trim().toLowerCase();
  if (format && FORMAT_INDUSTRY[format]) {
    parts.push(FORMAT_INDUSTRY[format]);
  }

  const modalities = delivery.modalities ?? [];
  if (modalities.includes("image") && !modalities.includes("text")) {
    parts.push(
      "绘画组合：仅含图片原子，走设计管线，交付插画/海报/封面等视觉资产。",
    );
  } else if (modalities.includes("text") && modalities.includes("image")) {
    parts.push("图文组合：文字为主、图片辅助表达。");
  }
  for (const modality of modalities) {
    if (MODALITY_INDUSTRY[modality]) {
      parts.push(MODALITY_INDUSTRY[modality]);
    }
  }

  if (delivery.topic) {
    parts.push(
      `创作主题「${delivery.topic}」：需结合该领域受众关注点与常见内容形式。`,
    );
  }

  return parts.length
    ? parts.join("\n")
    : "通用内容创作：注重平台特性、受众需求与可传播性。";
}

export function buildProductionLlmPrompt(state: AgentStateType): string {
  const profile = getProfile(state);
  const references = getReferences(state);
  const delivery = resolveDeliveryFromProfile(profile);
  const plan = getProductionPlan(state);
  const industry = plan.industry_context ?? resolveIndustryContext(delivery);
  const formatHint = buildFormatGenerationGuidance(
    delivery.format as ContentFormatId | null,
    delivery.modalities?.[0] ?? null,
  );

  const pendingBlock = plan.pending_tasks.length
    ? plan.pending_tasks
        .map(
          (c) =>
            `- [${c.department ?? "writing"}] ${c.description}${c.assignee ? `（@${c.assignee}）` : ""}`,
        )
        .join("\n")
    : "（无）";

  const deptBlock = plan.departments?.length
    ? departmentsBrief(plan.departments)
    : "文案部";

  const modePrompt = `当前任务：制作执行（制作团队出稿）

前提：使用当前作品方案（见下方）。制作总监已制定内部制作计划（不对${YOUGAN_USER_LABEL}复述计划细节）。

${formatHint ? `体裁写作要求：${formatHint}` : ""}

行业经验：
${industry}

执行流程（每次${YOUGAN_USER_LABEL}发消息时必须按序）：
1. 进入制作时系统已尝试补全方案缺口；若仍不可执行再引导${YOUGAN_USER_LABEL}补充说明。
2. 若内部计划尚未就绪，等待制作总监编排（勿对用户说「计划」一词，可说「步骤排好了」）。
3. add_plan_task → 按部门执行 → complete_execution。
4. 整体方向变化 → revise_production_plan。

禁止跳过 add_plan_task 直接生成；禁止向${YOUGAN_USER_LABEL}展示任务列表或部门分工细节。

${profileSummary(profile, references)}

${profileReferencesSummary(references)}

内部计划摘要：${getPlanSummary(plan) ?? "（待定）"}
创意总监备注：${plan.director_notes ?? "无"}

部门说明：
${deptBlock}

当前待执行任务：
${pendingBlock}

${productionPlanSummary(plan)}`;

  let gate = "";
  if (!isProfileActionable(profile)) {
    gate = `\n\n⚠ 作品方案仍缺关键信息，请引导${YOUGAN_USER_LABEL}补充创作主题或结构要点。`;
  } else if (!isPlanReady(plan)) {
    gate = `\n\n⚠ 内部计划编排中，完成后跟${YOUGAN_USER_LABEL}说「可以开始了」。`;
  }

  return composeSystemPrompt(modePrompt + gate);
}
