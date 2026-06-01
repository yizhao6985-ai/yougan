/**
 * 灵感模式 Tool 节点。
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { switchMode } from "../../../tools/mode.js";
import { confirmContentSpec } from "../../../tools/content-spec.js";
import { REFERENCE_TOOLS } from "../../../tools/references.js";

import {
  addBriefRequirement,
  clearBrief,
  confirmBriefReady,
  deleteBriefRequirement,
  updateBriefRequirement,
} from "./brief-tools.js";

export const INSPIRATION_TOOLS = [
  switchMode,
  addBriefRequirement,
  updateBriefRequirement,
  deleteBriefRequirement,
  clearBrief,
  confirmBriefReady,
  confirmContentSpec,
  ...REFERENCE_TOOLS,
];

export const toolNode = new ToolNode(INSPIRATION_TOOLS);
