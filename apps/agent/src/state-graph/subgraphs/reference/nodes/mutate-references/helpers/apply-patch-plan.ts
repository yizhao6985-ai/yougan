import {
  isPendingReferenceIntent,
  PENDING_REFERENCE_INTENT_SUMMARY,
  type WorkReference,
} from "@yougan/domain";

import {
  applyReferencePatch,
  findReferenceIndex,
  type ReferenceTarget,
} from "./reference-patch.js";
import type { ReferencePatch } from "./extract-patch-schema.js";

function attachUserContext(
  references: WorkReference[],
  target: ReferenceTarget,
  userContext: string,
): WorkReference[] | null {
  const index = findReferenceIndex(references, target);
  if (index < 0) return null;

  const next = [...references];
  next[index] = {
    ...next[index]!,
    intent: {
      summary: PENDING_REFERENCE_INTENT_SUMMARY,
      user_context: userContext.trim(),
    },
  };
  return next;
}

export function applyReferencePatchPlan(
  references: WorkReference[],
  patch: ReferencePatch,
  attachmentUrls: Set<string>,
): { references: WorkReference[]; warnings: string[] } {
  const warnings: string[] = [];
  let next = references;

  if (patch.deletes.length) {
    const result = applyReferencePatch(next, { deletes: patch.deletes });
    next = result.references;
    warnings.push(...result.warnings);
  }

  for (const item of patch.intent_updates) {
    const target = {
      reference_id: item.reference_id,
      index: item.index,
      asset_url: item.asset_url,
    };
    const hasTarget =
      target.index != null ||
      Boolean(target.reference_id?.trim()) ||
      Boolean(target.asset_url?.trim());

    if (!hasTarget) {
      warnings.push("intent_updates 须提供 reference_id、index 或 asset_url");
      continue;
    }

    const result = attachUserContext(next, target, item.user_context);
    if (result) {
      next = result;
    } else {
      warnings.push(
        `未找到参考素材 ${target.reference_id ?? target.asset_url ?? String(target.index ?? "")}`.trim(),
      );
    }
  }

  const global = patch.global_user_context?.trim();
  if (global) {
    next = next.map((ref) => {
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

  return { references: next, warnings };
}
