import {
  profileDeliveryStepSummary,
  profileExpressionSummary,
  profileConstraintsSummary,
  profileParamsSummary,
  profileSegmentsSummary,
  profileSettingsSummary,
} from "#agent/prompts/profile-summary.js";
import { YOUGAN_USER_LABEL } from "#agent/system-prompt.js";
import type { WorkProfile } from "@yougan/domain";
import {
  buildProfileStepPromptSection,
  getProfileSetupState,
  getProfileStepCopy,
} from "@yougan/domain";

export function buildSummarizeProfilePrompt(input: {
  before: WorkProfile;
  after: WorkProfile;
  user_message: string;
  changed: boolean;
}): string {
  const beforeSummary = input.before.intent.summary.trim() || "（尚无）";
  const afterSummary = input.after.intent.summary.trim() || "（尚无）";

  const setup = getProfileSetupState(input.after);
  const stepCopy = getProfileStepCopy(input.after, setup.activeStep);

  return `归纳本轮作品方案变更并生成面向${YOUGAN_USER_LABEL}的回复。

${buildProfileStepPromptSection(input.after)}

## 本轮是否有 staging 变更
${input.changed ? "有变更" : "无实质变更"}

## 变更前内容定位
${beforeSummary}

## 变更后内容定位
${afterSummary}

## 变更后完整方案（按步骤）
① 创作定位：${afterSummary}

② 内容形态与规格：
${profileDeliveryStepSummary(input.after)}
媒介规格：${profileParamsSummary(input.after)}

③ 表达设定：
${profileExpressionSummary(input.after)}

④ 结构与要素：
${profileSettingsSummary(input.after)}

${profileSegmentsSummary(input.after)}

⑤ 创作规则：
${profileConstraintsSummary(input.after)}

## ${YOUGAN_USER_LABEL}原话
${input.user_message.trim() || "（无）"}

## 输出规则
1. 直接输出面向感友的自然语言回复（不要 JSON、不要字段名）
2. 简要说明本轮对方案做了哪些更新；无变更则说明方案未改动
3. 引导在侧栏「制作方案」查看**第 ${setup.steps.find((s) => s.id === setup.activeStep)?.index ?? "?"} 步 · ${stepCopy.title}**
4. 禁止给出新的调整建议或替${YOUGAN_USER_LABEL}做决定`;
}
