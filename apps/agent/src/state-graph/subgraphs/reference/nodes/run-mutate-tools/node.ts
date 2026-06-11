/** 执行 reference 删改 tool_calls */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { MUTATE_REFERENCE_TOOLS } from "./tools/index.js";

export const runMutateToolsNode = new ToolNode(MUTATE_REFERENCE_TOOLS);
