/** 作品方案工具：与方案向导五步一一对应 */
import { createProfileTool } from "./helpers/run-profile-tool.js";
import {
  boundsFieldsSchema,
  buildBoundsPatch,
  buildDirectionPatch,
  buildRequirementsPatch,
  buildSettingPatch,
  buildStylePatch,
  directionFieldsSchema,
  requirementsFieldsSchema,
  settingFieldsSchema,
  styleFieldsSchema,
} from "./schemas.js";

export const updateProfileDirection = createProfileTool({
  name: "update_profile_direction",
  description:
    "更新方案「方向」：创作定位 summary、内容形式 format、受众 audience。",
  schema: directionFieldsSchema,
  toPatch: (input) => {
    const direction = buildDirectionPatch(input);
    return direction ? { direction } : {};
  },
  emptyMessage: "未提供可更新的方向字段。",
});

export const updateProfileStyle = createProfileTool({
  name: "update_profile_style",
  description: "更新方案「风格」：文字 verbal、画面 visual。",
  schema: styleFieldsSchema,
  toPatch: (input) => {
    const style = buildStylePatch(input);
    return style ? { style } : {};
  },
  emptyMessage: "未提供可更新的风格字段。",
});

export const updateProfileSetting = createProfileTool({
  name: "update_profile_setting",
  description:
    "更新方案「背景」：品牌事实、故事背景、人设等固定信息（items + mode）。",
  schema: settingFieldsSchema,
  toPatch: (input) => buildSettingPatch(input),
  emptyMessage: "未提供可更新的背景字段。",
});

export const updateProfileRequirements = createProfileTool({
  name: "update_profile_requirements",
  description:
    "更新方案「需求」：对成稿的期望，如字数、结构顺序、必含模块（items + mode）。",
  schema: requirementsFieldsSchema,
  toPatch: (input) => buildRequirementsPatch(input),
  emptyMessage: "未提供可更新的需求字段。",
});

export const updateProfileBounds = createProfileTool({
  name: "update_profile_bounds",
  description:
    "更新方案「边界」：不要出现的内容、需避免的写法（items + mode）。",
  schema: boundsFieldsSchema,
  toPatch: (input) => buildBoundsPatch(input),
  emptyMessage: "未提供可更新的边界字段。",
});

export const PROFILE_TOOLS = [
  updateProfileDirection,
  updateProfileStyle,
  updateProfileSetting,
  updateProfileRequirements,
  updateProfileBounds,
];
