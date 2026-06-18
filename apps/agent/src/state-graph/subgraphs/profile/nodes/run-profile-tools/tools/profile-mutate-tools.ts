/** 作品方案工具：与方案向导五步一一对应 */
import { createProfileTool } from "./helpers/run-profile-tool.js";
import {
  boundsFieldsSchema,
  buildBoundsPatch,
  buildContextPatch,
  buildDirectionPatch,
  buildSequencePatch,
  buildStylePatch,
  contextFieldsSchema,
  directionFieldsSchema,
  sequenceFieldsSchema,
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

export const updateProfileContext = createProfileTool({
  name: "update_profile_context",
  description:
    "更新方案「背景」：世界设定、品牌背景、人设等正向离散说明（items + mode）。",
  schema: contextFieldsSchema,
  toPatch: (input) => buildContextPatch(input),
  emptyMessage: "未提供可更新的背景字段。",
});

export const updateProfileSequence = createProfileTool({
  name: "update_profile_sequence",
  description:
    "更新方案「节拍」：有序内容意图，可指定 role（text/image/audio/video）；软参考，不 1:1 对应成稿。",
  schema: sequenceFieldsSchema,
  toPatch: (input) => buildSequencePatch(input),
  emptyMessage: "未提供可更新的节拍字段。",
});

export const updateProfileBounds = createProfileTool({
  name: "update_profile_bounds",
  description:
    "更新方案「边界」：反向离散说明，如禁止出现的元素、需避免的事项（items + mode）。",
  schema: boundsFieldsSchema,
  toPatch: (input) => buildBoundsPatch(input),
  emptyMessage: "未提供可更新的边界字段。",
});

export const PROFILE_TOOLS = [
  updateProfileDirection,
  updateProfileStyle,
  updateProfileContext,
  updateProfileSequence,
  updateProfileBounds,
];
