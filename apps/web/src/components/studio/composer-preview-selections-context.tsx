import { createContext, useContext, type ReactNode } from "react";

import {
  useComposerPreviewSelections,
  type ComposerPreviewSelectionsStore,
} from "@/hooks/use-composer-preview-selections";

const ComposerPreviewSelectionsContext =
  createContext<ComposerPreviewSelectionsStore | null>(null);

export function ComposerPreviewSelectionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const store = useComposerPreviewSelections();
  return (
    <ComposerPreviewSelectionsContext.Provider value={store}>
      {children}
    </ComposerPreviewSelectionsContext.Provider>
  );
}

export function useComposerPreviewSelectionsContext() {
  const value = useContext(ComposerPreviewSelectionsContext);
  if (!value) {
    throw new Error(
      "useComposerPreviewSelectionsContext must be used within ComposerPreviewSelectionsProvider",
    );
  }
  return value;
}

/** 作品面板等可选上下文：无 Provider 时不抛错 */
export function useOptionalComposerPreviewSelectionsContext() {
  return useContext(ComposerPreviewSelectionsContext);
}
