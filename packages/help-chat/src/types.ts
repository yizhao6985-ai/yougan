export type RagSource = {
  title: string;
  file: string;
  section: string;
  score: number;
};

export type HelpChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  sources?: RagSource[];
  error?: boolean;
};

export type HelpChatConfig = {
  /** AG-UI chat endpoint, e.g. http://localhost:8000/api/v1/chat */
  apiUrl: string;
  /** Optional auth or proxy headers */
  getHeaders?: () => Record<string, string> | undefined;
  launcherLabel?: string;
  launcherPlaceholder?: string;
  panelTitle?: string;
  panelDescription?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  composerPlaceholder?: string;
  sendLabel?: string;
  closeLabel?: string;
  errorMessage?: string;
  starterQuestions?: string[];
};
