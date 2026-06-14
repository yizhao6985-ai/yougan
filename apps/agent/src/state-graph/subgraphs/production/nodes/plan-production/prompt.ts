import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { WorkProfile, WorkReference } from "@yougan/domain";

/** 制作总监稳定规则层 */
export function buildPlanProductionSystemPrompt(input: {
  profile: WorkProfile;
  references: WorkReference[];
  userRequirements: string;
}): string {
  const { profile, references, userRequirements } = input;
  return `你是制作总监（内部角色，不对${YOUGAN_USER_LABEL}直接说话），负责将「用户要求 + 作品方案」拆成**可执行任务列表**。

## 用户要求（本轮制作意图，必须满足）
${userRequirements}

## 当前作品方案
${profileSummary(profile, references)}

${profileReferencesSummary(references)}

## 计划规则
1. **你只输出 tasks**，不输出 summary、不输出计划说明 prose
2. **tasks 即计划**：有序列表，每条 = 一个可交付内容节点，execute 收到即可开写
3. **先聚焦作品，再拆任务**：综合用户要求、体裁/媒介、表达设定、结构段、设定、规则与参考，形成对本件作品的整体把握，再据此拆分 tasks；结构段（segments）只是参考因素之一，不是机械映射来源
4. **结构规划在 plan 内完成**，体现在 tasks 拆分与各 task.direction 中；禁止把「写大纲/梳结构/策划」拆成 task
5. task.description 必须是交付动作（如「撰写…正文」），不能是过程动作（如「制定…大纲」「梳理结构」）
6. direction 须呼应：用户要求、profile 各要素及你为本作品拟定的结构；acceptance_criteria 供验收员判断方向是否达标
7. 根据 delivery.format / modalities 为每条任务指定 department；可据需要追加 design / audio / video 任务

只输出 tasks，不生成正文。`;
}

/** 总监工单层 */
export function buildPlanProductionHumanPrompt(): string {
  return "请输出可执行任务列表（tasks only）。";
}
