import {
  resolveDeliveryFromProfile,
  type ContentFormatId,
  type ProductionTask,
  type WorkProfile,
  type WorkReference,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";

import { buildFormatGenerationGuidance } from "../../helpers/format-guidance.js";
import { defaultTaskGuidance } from "../../helpers/task-plan.js";

export type ProduceTaskPromptInput = {
  profile: WorkProfile;
  references: WorkReference[];
  task: ProductionTask;
  userRequirements: string | null;
  readySnippet: string;
  executorLabel: string;
};

function resolveTaskGuidance(task: ProductionTask) {
  const guidance = defaultTaskGuidance(task.description);
  if (task.direction?.trim()) guidance.direction = task.direction.trim();
  if (task.acceptance_criteria?.trim()) {
    guidance.acceptance_criteria = task.acceptance_criteria.trim();
  }
  return guidance;
}

/** 执行者稳定规则层：角色、方案约束、体裁与输出契约 */
export function buildProduceTaskSystemPrompt(input: {
  profile: WorkProfile;
  references: WorkReference[];
  userRequirements: string | null;
  executorLabel: string;
}): string {
  const { profile, references, userRequirements, executorLabel } = input;
  const delivery = resolveDeliveryFromProfile(profile);
  const formatGuidance = buildFormatGenerationGuidance(
    delivery.format as ContentFormatId | null,
    delivery.modalities?.[0] ?? null,
    profile,
    { scope: "fragment" },
  );
  const guardrails = profile.guardrails
    .filter((g) => g.scope === "all" || g.scope === "verbal")
    .map((g) => `- ${g.description}`)
    .join("\n");
  const settings = profile.blueprint.settings
    .map((s) => {
      const kind =
        s.kind === "character" ? "对象" : s.kind === "world" ? "背景" : "设定";
      const name = s.title?.trim();
      return `- [${kind}${name ? ` · ${name}` : ""}] ${s.description}`;
    })
    .join("\n");

  return `你是${executorLabel}，专注完成**单个任务**并在实现层面做到最好。你只产出该任务的交付片段，不做最终整合。

## 作品方案（profile）
${profileSummary(profile, references)}

用户要求：${userRequirements ?? "无"}

主题：${delivery.topic ?? "未指定"}
体裁：${delivery.format ?? "未指定"}
媒介：${delivery.modalities?.join(",") ?? "未指定"}
风格：${profile.expression.verbal?.style ?? "未指定"}；语气：${profile.expression.verbal?.tone ?? "未指定"}
受众：${profile.expression.audience ?? "未指定"}

创作设定：
${settings || "无"}

创作规则（必须遵守）：
${guardrails || "无"}

体裁与媒介要求：
${formatGuidance}

## 输出契约
- 你产出的是**计划中的一个片段**，不必单独满足方案全文篇幅；整合阶段会拼接并统一控篇幅
- 只输出本任务的交付物（body 必填；title/notes 按需）
- 勿复述 profile 摘要或用户要求；body 必须是该任务的专业交付内容
- 本 task 已是计划中的执行单元；勿自行补充大纲、增删章节或重写整体结构`;
}

/** 总监工单层：本任务目标、方向指导与质检反馈 */
export function buildProduceTaskHumanPrompt(input: ProduceTaskPromptInput): string {
  const { task, readySnippet } = input;
  const guidance = resolveTaskGuidance(task);

  const feedbackBlock = task.feedback?.trim()
    ? `\n## 质检修改建议（必须落实）\n${task.feedback.trim()}\n`
    : "";

  const readyBlock = readySnippet
    ? `\n## 已备妥的其他任务片段（勿重复，可呼应）\n${readySnippet}\n`
    : "";

  return `请完成以下制作任务。

## 当前任务
- 描述：${task.description}
- 部门：${task.department ?? "writing"}

## 总监方向指导（必须遵循）
${guidance.direction}

## 方向性验收标准（供你自检，不是输出内容）
${guidance.acceptance_criteria}
${feedbackBlock}${readyBlock}
请按 system 规则与本工单要求，输出本任务交付物。`;
}
