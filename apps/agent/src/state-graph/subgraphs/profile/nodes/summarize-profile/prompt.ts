import {
  profileDeliverySummary,
  profileExpressionSummary,
  profileGuardrailsSummary,
  profileParamsSummary,
  profileSegmentsSummary,
  profileSettingsSummary,
} from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { WorkProfile } from "@yougan/domain";

export function buildSummarizeProfilePrompt(input: {
  before: WorkProfile;
  after: WorkProfile;
  user_message: string;
  changed: boolean;
}): string {
  const beforeSummary = input.before.blueprint.summary.trim() || "（尚无）";
  const afterSummary = input.after.blueprint.summary.trim() || "（尚无）";

  return `归纳本轮作品方案变更并生成面向${YOUGAN_USER_LABEL}的回复。

## 本轮是否有 staging 变更
${input.changed ? "有变更" : "无实质变更"}

## 变更前内容定位
${beforeSummary}

## 变更后内容定位
${afterSummary}

## 变更后完整方案
交付规格：
${profileDeliverySummary(input.after)}

表达设定：
${profileExpressionSummary(input.after)}

体裁参数：
${profileParamsSummary(input.after)}

${profileSettingsSummary(input.after)}

${profileSegmentsSummary(input.after)}

${profileGuardrailsSummary(input.after)}

## ${YOUGAN_USER_LABEL}原话
${input.user_message.trim() || "（无）"}

## 输出规则
1. reply：简要说明本轮对方案做了哪些更新；无变更则说明方案未改动
2. 引导在侧栏「作品方案」查看详情
3. 禁止给出新的调整建议或替${YOUGAN_USER_LABEL}做决定`;
}
