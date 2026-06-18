export type NextStepSuggestionsPromptInput = {
  count: number;
  isOpening: boolean;
  /** 已有方案/成稿：区分扩展当前状态 vs 下一步引导 */
  layered: boolean;
  lastUserMessage?: string;
  lastAssistantReply?: string;
};
