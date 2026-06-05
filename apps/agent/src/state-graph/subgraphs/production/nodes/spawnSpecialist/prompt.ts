import {
  getPlanSummary,
  profileSummary,
  resolveContentSpecFromProfile,
  type ProductionDepartment,
  type WorkProductionPlan,
  type WorkProfile,
} from "@yougan/domain";

import { departmentBrief } from "../../helpers/department-brief.js";
import { DEPARTMENT_LABELS } from "../../helpers/department-labels.js";

export function buildSpawnSpecialistPrompt(input: {
  profile: WorkProfile;
  plan: WorkProductionPlan;
  department: ProductionDepartment;
  brief: string;
  specialistName: string;
}): string {
  const contentProfile = resolveContentSpecFromProfile(input.profile);
  const label = DEPARTMENT_LABELS[input.department];
  const industry = input.plan.industry_context ?? "";

  return `你是${input.specialistName}（${departmentBrief(input.department)}），执行以下任务：

任务说明：${input.brief}

作品主题：${contentProfile.content_topic ?? "未指定"}
体裁：${contentProfile.content_format ?? "未指定"}
作品方案：${profileSummary(input.profile)}
创作计划：${getPlanSummary(input.plan) ?? "无"}
行业背景：${industry}

请输出该部门的专业交付物，用 Markdown 格式。`;
}

export function specialistDisplayName(
  department: ProductionDepartment,
  specialistName?: string | null,
): string {
  return specialistName?.trim() || DEPARTMENT_LABELS[department];
}
