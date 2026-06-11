import {
  isPendingReferenceIntent,
  PENDING_REFERENCE_INTENT_SUMMARY,
  type WorkReference,
} from "@yougan/domain";

import {
  findReferenceIndex,
  type ReferenceTarget,
} from "./reference-patch.js";

export function attachReferenceUserContext(
  references: WorkReference[],
  target: ReferenceTarget,
  userContext: string,
): { references: WorkReference[]; warning?: string } {
  const index = findReferenceIndex(references, target);
  if (index < 0) {
    return {
      references,
      warning: `未找到参考素材 ${target.reference_id ?? target.asset_url ?? String(target.index ?? "")}`.trim(),
    };
  }

  const next = [...references];
  next[index] = {
    ...next[index]!,
    intent: {
      summary: PENDING_REFERENCE_INTENT_SUMMARY,
      user_context: userContext.trim(),
    },
  };
  return { references: next };
}

export function attachPendingReferencesContext(
  references: WorkReference[],
  userContext: string,
  attachmentUrls: Set<string>,
): WorkReference[] {
  const global = userContext.trim();
  if (!global) return references;

  return references.map((ref) => {
    const isUploadedThisTurn = attachmentUrls.has(ref.asset.url);
    const isPending = isPendingReferenceIntent(ref.intent);
    if (!isPending && !isUploadedThisTurn) return ref;
    return {
      ...ref,
      intent: {
        summary: PENDING_REFERENCE_INTENT_SUMMARY,
        user_context: global,
      },
    };
  });
}
