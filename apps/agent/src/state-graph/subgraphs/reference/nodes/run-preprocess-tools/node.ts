/** 执行 reference 预处理 tool_calls */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { PREPROCESS_REFERENCE_TOOLS } from "./tools/index.js";

export const runPreprocessToolsNode = new ToolNode(PREPROCESS_REFERENCE_TOOLS);
