/** 执行 profile 子图 tool_calls */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { PROFILE_TOOLS } from "./tools/index.js";

export const runProfileToolsNode = new ToolNode(PROFILE_TOOLS);
