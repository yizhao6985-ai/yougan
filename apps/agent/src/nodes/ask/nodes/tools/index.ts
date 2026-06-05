/**
 * 提问模式 Tool 节点。
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { REFERENCE_TOOLS } from "#agent/tools/references.js";

import { addBlueprintConstraintFromAsk } from "./nodes/add-blueprint-from-ask.js";

export const ASK_TOOLS = [addBlueprintConstraintFromAsk, ...REFERENCE_TOOLS];

export const toolNode = new ToolNode(ASK_TOOLS);
