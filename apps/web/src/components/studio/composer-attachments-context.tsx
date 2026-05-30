import { createContext, useContext, type ReactNode } from "react";

import {
  useComposerAttachments,
  type ComposerAttachmentsStore,
} from "@/hooks/use-composer-attachments";

const ComposerAttachmentsContext = createContext<ComposerAttachmentsStore | null>(
  null,
);

export function ComposerAttachmentsProvider({ children }: { children: ReactNode }) {
  const store = useComposerAttachments();
  return (
    <ComposerAttachmentsContext.Provider value={store}>
      {children}
    </ComposerAttachmentsContext.Provider>
  );
}

export function useComposerAttachmentsContext() {
  const value = useContext(ComposerAttachmentsContext);
  if (!value) {
    throw new Error(
      "useComposerAttachmentsContext must be used within ComposerAttachmentsProvider",
    );
  }
  return value;
}
