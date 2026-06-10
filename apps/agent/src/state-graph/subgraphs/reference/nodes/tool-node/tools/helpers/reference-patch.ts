import type { ReferenceIntent, WorkReference } from "@yougan/domain";

export type ReferenceTarget = {
  reference_id?: string;
  index?: number;
  asset_url?: string;
};

export type ReferenceIntentPatch = ReferenceTarget & {
  intent: ReferenceIntent;
};

export function findReferenceIndex(
  references: WorkReference[],
  target: { reference_id?: string; index?: number; asset_url?: string },
): number {
  const { reference_id, index, asset_url } = target;
  if (typeof index === "number" && index >= 0 && index < references.length) {
    return index;
  }
  if (reference_id?.trim()) {
    const id = reference_id.trim();
    return references.findIndex((item) => item.id === id);
  }
  if (asset_url?.trim()) {
    const url = asset_url.trim();
    return references.findIndex((item) => item.asset.url === url);
  }
  return -1;
}

function deleteWorkReference(
  references: WorkReference[],
  target: { reference_id?: string; asset_url?: string; index?: number },
): WorkReference[] | null {
  if (!references.length) return null;
  const removeAt = findReferenceIndex(references, target);
  if (removeAt < 0) return null;
  return references.filter((_, i) => i !== removeAt);
}

function applyReferenceDeletes(
  references: WorkReference[],
  targets: Array<{ reference_id?: string; index?: number; asset_url?: string }>,
): { references: WorkReference[]; deleted: number; warnings: string[] } {
  let next = references;
  let deleted = 0;
  const warnings: string[] = [];

  const byIdOrUrl = targets.filter(
    (t) => t.reference_id?.trim() || t.asset_url?.trim(),
  );
  const byIndex = targets
    .filter(
      (t) =>
        t.index != null && !t.reference_id?.trim() && !t.asset_url?.trim(),
    )
    .map((t) => t.index!)
    .sort((a, b) => b - a);

  for (const target of byIdOrUrl) {
    const result = deleteWorkReference(next, target);
    if (result) {
      next = result;
      deleted++;
    } else {
      warnings.push(
        `未找到参考素材 ${target.reference_id ?? target.asset_url ?? ""}`.trim(),
      );
    }
  }

  for (const index of byIndex) {
    const result = deleteWorkReference(next, { index });
    if (result) {
      next = result;
      deleted++;
    } else {
      warnings.push(`未找到下标 ${index} 的参考素材`);
    }
  }

  for (const _ of targets.filter(
    (t) =>
      t.index == null && !t.reference_id?.trim() && !t.asset_url?.trim(),
  )) {
    warnings.push("删除项须提供 reference_id、index 或 asset_url");
  }

  return { references: next, deleted, warnings };
}

function updateWorkReferenceIntent(
  references: WorkReference[],
  target: ReferenceTarget,
  intent: ReferenceIntent,
): WorkReference[] | null {
  const index = findReferenceIndex(references, target);
  if (index < 0) return null;
  const summary = intent.summary.trim();
  if (!summary) return null;

  const next = [...references];
  next[index] = { ...next[index]!, intent: { summary } };
  return next;
}

export function applyReferencePatch(
  references: WorkReference[],
  patch: {
    deletes?: ReferenceTarget[];
    updates?: ReferenceIntentPatch[];
  },
): {
  references: WorkReference[];
  deleted: number;
  updated: number;
  warnings: string[];
} {
  const deletes = patch.deletes ?? [];
  const updates = patch.updates ?? [];
  const warnings: string[] = [];

  const deleteResult = deletes.length
    ? applyReferenceDeletes(references, deletes)
    : { references, deleted: 0, warnings: [] as string[] };
  warnings.push(...deleteResult.warnings);

  let next = deleteResult.references;
  let updated = 0;

  for (const item of updates) {
    const summary = item.intent?.summary?.trim();
    const target: ReferenceTarget = {
      reference_id: item.reference_id,
      index: item.index,
      asset_url: item.asset_url,
    };

    if (
      target.index == null &&
      !target.reference_id?.trim() &&
      !target.asset_url?.trim()
    ) {
      warnings.push("更新项须提供 reference_id、index 或 asset_url");
      continue;
    }
    if (!summary) {
      warnings.push("更新项须提供 intent.summary");
      continue;
    }

    const result = updateWorkReferenceIntent(next, target, { summary });
    if (result) {
      next = result;
      updated++;
    } else {
      warnings.push(
        `未找到参考素材 ${target.reference_id ?? target.asset_url ?? String(target.index ?? "")}`.trim(),
      );
    }
  }

  return {
    references: next,
    deleted: deleteResult.deleted,
    updated,
    warnings,
  };
}
