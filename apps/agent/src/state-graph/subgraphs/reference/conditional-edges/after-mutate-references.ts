/** mutateReferences 之后：有 tool_calls 则执行删改工具，否则进入 finalize */
export const from = "mutateReferences" as const;

/** toolsCondition 返回 "tools"，本图节点名为 runMutateTools */
export const paths = {
  tools: "runMutateTools",
  __end__: "finalizeReferences",
} as const;
