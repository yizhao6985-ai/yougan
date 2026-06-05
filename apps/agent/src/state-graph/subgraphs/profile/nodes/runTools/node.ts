/** tool-runner：执行 llmCall 绑定的 tool_calls */
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { PROFILE_TOOLS } from "../llmCall/tools/index.js";

export const runTools = new ToolNode(PROFILE_TOOLS);
