/**
 * 灵感模式 Tool 节点（仅 brief，不含大纲）。
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { confirmContentSpec } from "../../../tools/content-spec.js";
import { REFERENCE_TOOLS } from "../../../tools/references.js";

import {
  addBriefRequirement,
  clearBrief,
  deleteBriefRequirement,
  updateBriefRequirement,
} from "./brief-tools.js";

export const INSPIRATION_TOOLS = [
  addBriefRequirement,
  updateBriefRequirement,
  deleteBriefRequirement,
  clearBrief,
  confirmContentSpec,
  ...REFERENCE_TOOLS,
];

export const toolNode = new ToolNode(INSPIRATION_TOOLS);
