/** 执行 ask 子图 tool_calls */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { ASK_TOOLS } from "./tools/index.js";

export const runAskToolsNode = new ToolNode(ASK_TOOLS);
