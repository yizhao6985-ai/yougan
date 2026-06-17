import {
  getIntentSummary,
  resolveDeliveryFromProfile,
  type ContentFormatId,
  type ProductionTask,
  type WorkProfile,
  type WorkReference,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";

import { resolveImageAspectRatio } from "../../helpers/image-aspect-ratio.js";
import { buildFormatGenerationGuidance } from "../../helpers/format-guidance.js";
import { defaultTaskGuidance } from "../../helpers/task-plan.js";
import type { ProduceTaskPromptInput } from "../execute-writing/prompt.js";

function resolveTaskGuidance(task: ProductionTask) {
  const guidance = defaultTaskGuidance(task.description);
  if (task.direction?.trim()) guidance.direction = task.direction.trim();
  if (task.acceptance_criteria?.trim()) {
    guidance.acceptance_criteria = task.acceptance_criteria.trim();
  }
  return guidance;
}

/** 设计执行者稳定规则层 */
export function buildDesignTaskSystemPrompt(input: {
  profile: WorkProfile;
  references: WorkReference[];
  userRequirements: string | null;
}): string {
  const { profile, references, userRequirements } = input;
  const delivery = resolveDeliveryFromProfile(profile);
  const aspectRatio = resolveImageAspectRatio(profile);
  const formatGuidance = buildFormatGenerationGuidance(
    delivery.format as ContentFormatId | null,
    delivery.modalities?.[0] ?? null,
    profile,
    { scope: "fragment" },
  );
  const rules = profile.constraints.rules
    .filter((g) => g.scope === "all" || g.scope === "visual")
    .map((g) => `- ${g.description}`)
    .join("\n");

  return `你是设计执行者，负责为当前制作任务编写**文生图 prompt** 与**给用户看的短说明**。

## 流水线位置
设计任务固定走：**executeDesign（本节点）→ renderDesignImage（MiniMax image-01 出图）→ acceptTask（验收）**。
- dispatch 始终经本节点进入，不会跳过直达出图
- 你不输出图片；prompt 与短说明定稿后，由 render 节点调用 image-01 生成成图
- 若收到质检 feedback 针对画面内容，须在本次重写 prompt，以指导下一次出图

## 作品方案（profile）
${profileSummary(profile, references)}

用户要求：${userRequirements ?? "无"}

主题：${getIntentSummary(profile) || "未指定"}
体裁：${delivery.format ?? "未指定"}
媒介：${delivery.modalities?.join(",") ?? "未指定"}
画幅：${aspectRatio}

体裁与媒介要求：
${formatGuidance}

创作规则（必须遵守）：
${rules || "无"}

## 输出契约
- **body**：完整、可直接用于 image-01 的 prompt（主体、构图、风格、光线、色彩；可中英混写）；须按上方画幅 **${aspectRatio}** 满幅构图，主体铺满画布，避免 letterbox、黑边、宽银幕上下遮幅
- **notes**：1–3 句中文短说明，供用户阅读（整合进作品 preview.body），勿复制粘贴 body
- **title**：可选画面标题
- **negative_prompt**：可选，列出需避开的元素
- 禁止 markdown 包裹、禁止「以下是提示词」等前缀`;
}

/** 设计执行者工单层 */
export function buildDesignTaskHumanPrompt(input: ProduceTaskPromptInput): string {
  const { task, readySnippet } = input;
  const guidance = resolveTaskGuidance(task);

  const feedbackBlock = task.feedback?.trim()
    ? `\n## 质检修改建议（必须落实；若针对成图效果，重写 prompt 以指导下一次出图）\n${task.feedback.trim()}\n`
    : "";

  const readyBlock = readySnippet
    ? `\n## 已备妥的其他任务片段（仅供了解前情，勿复述）
${readySnippet}\n`
    : "";

  return `请为以下设计任务编写文生图 prompt 与短说明。

## 当前任务
- 描述：${task.description}
- 部门：design

## 总监方向指导（必须遵循）
${guidance.direction}

## 方向性验收标准（供你自检）
${guidance.acceptance_criteria}
${feedbackBlock}${readyBlock}
请按 system 规则输出 body / notes / title / negative_prompt。`;
}
