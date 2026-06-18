/** LangGraph checkpoint 内 AI 额度快照（API 注入 + Agent 调用期间累加） */
export type AiUsageSnapshot = {
  planId: string;
  quotaMicroCredits: number;
  /** 本周期用量（DB 已入账 + 当前 Agent 调用内未落库部分） */
  settledMicroCredits: number;
  usagePercent: number;
  usageExceeded: boolean;
};

export const EMPTY_AI_USAGE: AiUsageSnapshot = {
  planId: "free",
  quotaMicroCredits: 0,
  settledMicroCredits: 0,
  usagePercent: 0,
  usageExceeded: false,
};
