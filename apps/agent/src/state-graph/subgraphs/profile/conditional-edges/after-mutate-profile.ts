/** mutateProfile 之后：有 tool_calls 则执行方案工具，否则进入 finalize */
export const from = "mutateProfile" as const;

/** toolsCondition 返回 "tools"，本图节点名为 runProfileTools */
export const paths = {
  tools: "runProfileTools",
  __end__: "finalizeProfile",
} as const;
