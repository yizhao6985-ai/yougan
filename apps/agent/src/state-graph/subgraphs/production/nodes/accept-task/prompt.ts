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
  const { profile, references, task } = input;
  const wordCountRequirement = buildWordCountRequirement(profile);
  const wordCountNote = wordCountRequirement
    ? `方案全文篇幅要求（${wordCountRequirement}）在 assemblePreview 整合阶段统一校验；本任务仅验收片段是否方向正确、质量达标，勿按全文字数否决单片段。`
    : "";

  const designNote =
    task?.department === "design"
      ? `
## 设计任务验收说明
- 本任务在 **renderDesignImage 出图之后**验收；成图 URL 与文生图 prompt 的结构完整性已在系统侧校验
- **重点验收文生图 prompt**（与文案任务验收正文 body 同理）：是否契合作品方案、总监方向与验收标准；是否足够具体、可执行、无明显跑题或空洞
- 短说明（notes）是否与 prompt 方向一致；有 title 时可一并参考
- **勿依据成图 URL 评判画面质量**（验收员无法查看成图）；出图失败由 renderDesignImage 重试，不在此否决 prompt
- prompt 方向有问题时，feedback 应给出可操作的修改建议，便于 executeDesign 重写 prompt 后再次出图`
      : "";

  return `你是制作验收员，从**总监方向指导**层面验收单任务产出（不是只看有没有写完）。

## 作品方案（profile 摘要）
${profileSummary(profile, references)}

## 验收原则
- 是否契合作品方案的方向、体裁与规则
- 是否响应该任务的目标与总监指导
- 实现质量是否达标
${wordCountNote ? `\n${wordCountNote}` : ""}${designNote}`;
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
${task.department === "design" ? "（设计任务：主交付物为文生图 prompt；成图 URL 仅表示出图链路已完成，请像验收文案片段一样验收 prompt 的方向与质量）\n" : ""}
用户要求：${userRequirements ?? "无"}

## 总监方向指导
${direction}

## 方向性验收标准
${acceptanceCriteria}

## 本任务交付物
${deliverableBody.slice(0, 2000)}
${deliverableNotes ? `\n备注：${deliverableNotes.slice(0, 500)}` : ""}

请判断是否通过方向性验收。`;
}
