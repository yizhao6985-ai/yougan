import { ToolNode } from "@langchain/langgraph/prebuilt";

import { REFERENCE_TOOLS } from "./tools/index.js";

export const toolNode = new ToolNode(REFERENCE_TOOLS);
