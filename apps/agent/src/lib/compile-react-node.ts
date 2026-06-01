/**
 * LangGraph ReAct 子图编译器：llmCall → toolsCondition → ToolNode → llmCall。
 * @see https://docs.langchain.com/oss/javascript/langgraph/quickstart#use-the-graph-api
 */
import { SystemMessage } from "@langchain/core/messages";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { END, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";

import { env } from "../env.js";
import { createChatModel } from "../llm/dashscope.js";
import { AgentState, type AgentStateType } from "../state.js";

/** ReAct 编排环使用服务端默认温度，不受用户「创意度」影响。 */
const FLOW_CONTROL_TEMPERATURE = env.llmTemperature;

export interface ReactToolsConditionalEdge {
  router: typeof toolsCondition;
  paths: (toolsNodeId: string) => [string, typeof END];
}

export function compileReactNode(options: {
  tools: StructuredToolInterface[];
  buildSystemPrompt: (state: AgentStateType) => string;
  name: string;
  conditionalEdge: ReactToolsConditionalEdge;
}) {
  const { tools, buildSystemPrompt, name, conditionalEdge } = options;
  const llmNodeId = `${name}LlmCall`;
  const toolsNodeId = `${name}Tools`;
  const toolNode = new ToolNode(tools);

  const modelCache = new Map<number, ReturnType<typeof createChatModel>>();

  function getModelWithTools(temperature: number) {
    let model = modelCache.get(temperature);
    if (!model) {
      model = createChatModel({ temperature });
      modelCache.set(temperature, model);
    }
    return model.bindTools(tools);
  }

  async function llmCall(state: AgentStateType) {
    const modelWithTools = getModelWithTools(FLOW_CONTROL_TEMPERATURE);
    const response = await modelWithTools.invoke([
      new SystemMessage(buildSystemPrompt(state)),
      ...(state.messages ?? []),
    ]);
    return { messages: [response] };
  }

  return new StateGraph(AgentState)
    .addNode(llmNodeId, llmCall)
    .addNode(toolsNodeId, toolNode)
    .addEdge(START, llmNodeId)
    .addConditionalEdges(
      llmNodeId,
      conditionalEdge.router,
      conditionalEdge.paths(toolsNodeId),
    )
    .addEdge(toolsNodeId, llmNodeId)
    .compile();
}
