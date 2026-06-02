/**
 * 大纲模式 Tool 节点。
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { REFERENCE_TOOLS } from "../../../tools/references.js";

import {
  addOutlineSection,
  clearOutline,
  deleteOutlineSection,
  updateOutlineSection,
} from "./outline-tools.js";
import { reviseOutline } from "./revise-outline.js";

export const OUTLINE_TOOLS = [
  addOutlineSection,
  updateOutlineSection,
  deleteOutlineSection,
  clearOutline,
  reviseOutline,
  ...REFERENCE_TOOLS,
];

export const toolNode = new ToolNode(OUTLINE_TOOLS);
