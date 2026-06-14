import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";

import type { HelpChatConfig } from "../types";

const DEFAULT_CONFIG: HelpChatConfig = {
  apiUrl: "http://localhost:4000/api/v1/chat",
  launcherLabel: "了解有感",
  launcherPlaceholder: "了解有感，打开产品助手",
  panelTitle: "有感助手",
  panelDescription: "基于产品知识库回答使用与功能问题",
  emptyTitle: "有什么想了解的？",
  emptyDescription: "例如：有感是什么、如何开始创作、会员与发布相关说明。",
  composerPlaceholder: "输入你的问题…",
  sendLabel: "发送",
  closeLabel: "关闭",
  errorMessage: "发送失败，请稍后重试。",
  starterQuestions: [
    "有感是什么？适合做什么内容？",
    "如何开始第一次创作？",
    "会员和 AI 额度怎么算？",
  ],
};

const HelpChatConfigContext = createContext<HelpChatConfig>(DEFAULT_CONFIG);

export function HelpChatProvider({
  children,
  apiUrl,
  getHeaders,
  launcherLabel,
  launcherPlaceholder,
  panelTitle,
  panelDescription,
  emptyTitle,
  emptyDescription,
  composerPlaceholder,
  sendLabel,
  closeLabel,
  errorMessage,
  starterQuestions,
}: PropsWithChildren<Partial<HelpChatConfig>>) {
  const value = useMemo(
    () => ({
      ...DEFAULT_CONFIG,
      ...(apiUrl ? { apiUrl } : null),
      ...(getHeaders ? { getHeaders } : null),
      ...(launcherLabel ? { launcherLabel } : null),
      ...(launcherPlaceholder ? { launcherPlaceholder } : null),
      ...(panelTitle ? { panelTitle } : null),
      ...(panelDescription ? { panelDescription } : null),
      ...(emptyTitle ? { emptyTitle } : null),
      ...(emptyDescription ? { emptyDescription } : null),
      ...(composerPlaceholder ? { composerPlaceholder } : null),
      ...(sendLabel ? { sendLabel } : null),
      ...(closeLabel ? { closeLabel } : null),
      ...(errorMessage ? { errorMessage } : null),
      ...(starterQuestions ? { starterQuestions } : null),
    }),
    [
      apiUrl,
      getHeaders,
      launcherLabel,
      launcherPlaceholder,
      panelTitle,
      panelDescription,
      emptyTitle,
      emptyDescription,
      composerPlaceholder,
      sendLabel,
      closeLabel,
      errorMessage,
      starterQuestions,
    ],
  );

  return (
    <HelpChatConfigContext.Provider value={value}>
      {children}
    </HelpChatConfigContext.Provider>
  );
}

export function useHelpChatConfig() {
  return useContext(HelpChatConfigContext);
}
