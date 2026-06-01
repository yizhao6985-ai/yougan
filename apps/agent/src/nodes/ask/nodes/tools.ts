/**
 * 提问模式 Tool 节点。
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { switchMode } from "../../../tools/mode.js";
import { confirmContentSpec } from "../../../tools/content-spec.js";
import { REFERENCE_TOOLS } from "../../../tools/references.js";

import { addBriefFromAsk } from "./add-brief-from-ask.js";

export const ASK_TOOLS = [
  switchMode,
  confirmContentSpec,
  addBriefFromAsk,
  ...REFERENCE_TOOLS,
];

export const toolNode = new ToolNode(ASK_TOOLS);
