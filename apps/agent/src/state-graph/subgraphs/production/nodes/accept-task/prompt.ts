import type { ProductionTask, WorkProfile, WorkReference } from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";

import { buildWordCountRequirement } from "../../helpers/word-count-guidance.js";

export type AcceptTaskPromptInput = {
  profile: WorkProfile;
  references: WorkReference[];
  task: ProductionTask;
  userRequirements: string | null;
  direction: string;
  acceptanceCriteria: string;
  deliverableBody: string;
  deliverableNotes?: string | null;
};

/** 验收员稳定规则层 */
export function buildAcceptTaskSystemPrompt(input: {
  profile: WorkProfile;
  references: WorkReference[];
  task?: ProductionTask;
}): string {
  const { profile, references } = input;
  const wordCountRequirement = buildWordCountRequirement(profile);
  const wordCountNote = wordCountRequirement
    ? `方案全文篇幅要求（${wordCountRequirement}）在 assemblePreview 整合阶段统一校验；本任务仅验收片段是否方向正确、质量达标，勿按全文字数否决单片段。`
    : "";

  return `你是制作验收员，从**总监方向指导**层面验收单任务产出（不是只看有没有写完）。

## 作品方案（profile 摘要）
${profileSummary(profile, references)}

## 验收原则
- 是否契合作品方案的方向、体裁与规则
- 是否响应该任务的目标与总监指导
- 实现质量是否达标
${wordCountNote ? `\n${wordCountNote}` : ""}`;
}

/** 总监工单层：待验收任务与交付物 */
export function buildAcceptTaskHumanPrompt(input: AcceptTaskPromptInput): string {
  const {
    task,
    userRequirements,
    direction,
    acceptanceCriteria,
    deliverableBody,
    deliverableNotes,
  } = input;

  return `请验收以下任务产出。

## 任务
描述：${task.description}
部门：${task.department ?? "writing"}
用户要求：${userRequirements ?? "无"}

## 总监方向指导
${direction}

## 方向性验收标准
${acceptanceCriteria}

## 本任务交付物
${deliverableBody.slice(0, 2000)}
${deliverableNotes ? `\n备注：${deliverableNotes.slice(0, 500)}` : ""}

请判断是否通过方向性验收；未通过时给出可操作的修改建议。`;
}
