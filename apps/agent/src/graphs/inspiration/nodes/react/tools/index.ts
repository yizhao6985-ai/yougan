/**
 * 灵感模式专属工具：CRUD + 参考素材。
 */
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import { findRequirementIndex } from "../../../../../lib/inspiration-merge.js";
import {
  EMPTY_WORK_INSPIRATION,
  newConfirmedRequirement,
} from "../../../../../schema.js";
import { switchMode } from "../../../../../tools/mode.js";
import { confirmContentSpec } from "../../../../../tools/content-spec.js";
import { REFERENCE_TOOLS } from "../../../../../tools/references.js";

import { clearInspirations } from "./clear-inspirations.js";
import { confirmRequirement } from "./confirm-requirement.js";
import { deleteRequirement } from "./delete-requirement.js";
import { updateRequirement } from "./update-requirement.js";

export const INSPIRATION_TOOLS = [
  switchMode,
  confirmContentSpec,
  confirmRequirement,
  updateRequirement,
  deleteRequirement,
  clearInspirations,
  ...REFERENCE_TOOLS,
];
