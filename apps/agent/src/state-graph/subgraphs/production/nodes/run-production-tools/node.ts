/** 执行 production 子图 tool_calls */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { PRODUCTION_TOOLS } from "./tools/index.js";

export const runProductionToolsNode = new ToolNode(PRODUCTION_TOOLS);
