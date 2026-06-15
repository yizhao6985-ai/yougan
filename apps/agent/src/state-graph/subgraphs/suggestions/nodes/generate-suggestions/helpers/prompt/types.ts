export type NextStepSuggestionsPromptInput = {
  count: number;
  isOpening: boolean;
  topicMode: boolean;
  /** 方案未就绪，按步骤引导生成建议 */
  profileSetupMode: boolean;
  profileSetupFocus?: import("@yougan/domain").ProfileSetupSuggestionFocus;
  lastUserMessage?: string;
  lastAssistantReply?: string;
};
