/**
 * 提问模式 Tool 节点。
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { confirmContentSpec } from "#agent/tools/content-spec.js"
import { REFERENCE_TOOLS } from "#agent/tools/references.js"

import { addBriefFromAsk } from "./nodes/add-brief-from-ask.js";

export const ASK_TOOLS = [
  confirmContentSpec,
  addBriefFromAsk,
  ...REFERENCE_TOOLS,
];

export const toolNode = new ToolNode(ASK_TOOLS);
