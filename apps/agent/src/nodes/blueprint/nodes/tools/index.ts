/**
 * 作品方案模式 Tool 节点。
 */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { REFERENCE_TOOLS } from "#agent/tools/references.js";

import {
  addBlueprintBeat,
  addBlueprintConstraint,
  clearBlueprintBeats,
  clearBlueprintConstraints,
  deleteBlueprintBeat,
  deleteBlueprintConstraint,
  setBlueprintPremiseTool,
  updateBlueprintBeat,
  updateBlueprintConstraint,
  updateBlueprintSpec,
  updateBlueprintVoice,
} from "./nodes/blueprint-tools.js";
import { reviseBlueprint } from "./nodes/revise-blueprint.js";

export const BLUEPRINT_TOOLS = [
  updateBlueprintSpec,
  updateBlueprintVoice,
  setBlueprintPremiseTool,
  addBlueprintConstraint,
  updateBlueprintConstraint,
  deleteBlueprintConstraint,
  clearBlueprintConstraints,
  addBlueprintBeat,
  updateBlueprintBeat,
  deleteBlueprintBeat,
  clearBlueprintBeats,
  reviseBlueprint,
  ...REFERENCE_TOOLS,
];

export const toolNode = new ToolNode(BLUEPRINT_TOOLS);
