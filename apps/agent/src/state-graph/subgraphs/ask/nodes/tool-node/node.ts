/** tool-node：LangGraph ToolNode，执行 tools/ 内绑定的 tool_calls */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { ASK_TOOLS } from "./tools/index.js";

export const toolNode = new ToolNode(ASK_TOOLS);
