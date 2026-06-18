/** 作品方案工具：与方案向导五步一一对应 */
import { getProfile, getState } from "#agent/state-io/index.js";

import { createProfileTool } from "./helpers/run-profile-tool.js";
import {
  buildConstraintsPatch,
  buildDeliveryStepPatch,
  buildExpressionPatch,
  buildIntentPatch,
  buildStructurePatch,
  constraintsFieldsSchema,
  deliveryStepFieldsSchema,
  expressionFieldsSchema,
  intentFieldsSchema,
  structureFieldsSchema,
} from "./schemas.js";

export const updateProfileIntent = createProfileTool({
  name: "update_profile_intent",
  description: "更新方案第 1 步「创作定位」（summary）。",
  schema: intentFieldsSchema,
  toPatch: (input) => {
    const intent = buildIntentPatch(input);
    return intent ? { intent } : {};
  },
  emptyMessage: "未提供可更新的创作定位字段。",
});

export const updateProfileDelivery = createProfileTool({
  name: "update_profile_delivery",
  description:
    "更新方案第 2 步「内容形态与规格」（format、modalities、分媒介 media_params）。",
  schema: deliveryStepFieldsSchema,
  toPatch: (input) => {
    const profile = getProfile(getState());
    const delivery = buildDeliveryStepPatch(profile, input);
    return delivery ? { delivery } : {};
  },
  emptyMessage: "未提供可更新的内容形态与规格字段。",
});

export const updateProfileExpression = createProfileTool({
  name: "update_profile_expression",
  description: "更新方案第 3 步「表达设定」（受众、文字风格、画面方向）。",
  schema: expressionFieldsSchema,
  toPatch: (input) => {
    const expression = buildExpressionPatch(input);
    return expression ? { expression } : {};
  },
  emptyMessage: "未提供可更新的表达设定字段。",
});

export const updateProfileStructure = createProfileTool({
  name: "update_profile_structure",
  description:
    "更新方案第 4 步「结构与要素」（固定设定 settings、结构段 segments；role 仅 text/image/audio/video）。",
  schema: structureFieldsSchema,
  toPatch: (input) => buildStructurePatch(input),
  emptyMessage: "未提供可更新的结构与要素字段。",
});

export const updateProfileConstraints = createProfileTool({
  name: "update_profile_constraints",
  description:
    "更新方案第 5 步「创作规则」（rules）。每条 rule 可选 scope：all（全局）、verbal（文字/文案，勿用 text）、visual（画面）、audio、video。",
  schema: constraintsFieldsSchema,
  toPatch: (input) => buildConstraintsPatch(input),
  emptyMessage: "未提供可更新的创作规则字段。",
});

/** 五步方案工具（一步一工具） */
export const PROFILE_TOOLS = [
  updateProfileIntent,
  updateProfileDelivery,
  updateProfileExpression,
  updateProfileStructure,
  updateProfileConstraints,
];
