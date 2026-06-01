/**
 * 提问模式工具。
 */
import { switchMode } from "../../../../../tools/mode.js";
import { confirmContentSpec } from "../../../../../tools/content-spec.js";
import { REFERENCE_TOOLS } from "../../../../../tools/references.js";

import { confirmAskAsRequirement } from "./confirm-ask-as-requirement.js";

export const ASK_TOOLS = [
  switchMode,
  confirmContentSpec,
  confirmAskAsRequirement,
  ...REFERENCE_TOOLS,
];
