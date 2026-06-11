export type NextStepSuggestionsPromptInput = {
  count: number;
  isOpening: boolean;
  topicMode: boolean;
  lastUserMessage?: string;
  lastAssistantReply?: string;
};
