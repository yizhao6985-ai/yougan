import {
  getPlanSummary,
  resolveDeliveryFromProfile,
  type ProductionDepartment,
  type WorkProductionPlan,
  type WorkProfile,
} from "@yougan/domain";
import { profileSummary } from "#agent/prompts/profile-summary.js";

import { departmentBrief } from "../../helpers/department-brief.js";
import { DEPARTMENT_LABELS } from "../../helpers/department-labels.js";

export function buildSpawnSpecialistPrompt(input: {
  profile: WorkProfile;
  plan: WorkProductionPlan;
  department: ProductionDepartment;
  brief: string;
  specialistName: string;
}): string {
  const delivery = resolveDeliveryFromProfile(input.profile);
  const label = DEPARTMENT_LABELS[input.department];
  return `你是${input.specialistName}（${departmentBrief(input.department)}），执行以下任务：

任务说明：${input.brief}

作品主题：${delivery.topic ?? "未指定"}
体裁：${delivery.format ?? "未指定"}
媒介形式：${delivery.modalities?.join(",") ?? "未指定"}
作品方案：${profileSummary(input.profile)}
创作计划：${getPlanSummary(input.plan) ?? "无"}

请输出该部门的专业交付物，用 Markdown 格式。`;
}

export function specialistDisplayName(
  department: ProductionDepartment,
  specialistName?: string | null,
): string {
  return specialistName?.trim() || DEPARTMENT_LABELS[department];
}
