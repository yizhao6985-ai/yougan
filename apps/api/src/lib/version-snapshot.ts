import {
  EMPTY_WORK_PRODUCTION,
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_REFERENCES,
  parseProductionFromLegacyFields,
  parseProfileJson,
  parseReferencesJson,
  parseWorkPreview,
  previewPlainText,
  resolveReferencesFromWork,
  type WorkVersionSnapshot,
} from "@yougan/domain";

export function emptySnapshot(): WorkVersionSnapshot {
  return {
    profile: { ...EMPTY_WORK_PROFILE },
    references: [...EMPTY_WORK_REFERENCES],
    production: { ...EMPTY_WORK_PRODUCTION },
  };
}

export function parseSnapshot(raw: unknown): WorkVersionSnapshot {
  if (!raw || typeof raw !== "object") return emptySnapshot();
  const value = raw as Record<string, unknown>;
  const production = parseProductionFromLegacyFields({
    production: value.production,
    productionPlan: value.productionPlan,
    preview: value.preview,
  });
  return {
    profile: parseProfileJson(value.profile),
    references:
      value.references !== undefined
        ? parseReferencesJson(value.references)
        : [],
    production,
  };
}

export function snapshotFromAgentValues(
  values: Record<string, unknown>,
): WorkVersionSnapshot {
  const production = parseProductionFromLegacyFields({
    production: values.production,
    productionPlan: values.productionPlan,
    preview: values.preview,
  });
  return {
    profile: parseProfileJson(values.profile),
    references: resolveReferencesFromWork({
      references: values.references,
    }),
    production,
  };
}

function stableJson(value: unknown): string {
  return JSON.stringify(value);
}

export function snapshotsEqual(
  a: WorkVersionSnapshot,
  b: WorkVersionSnapshot,
): boolean {
  return stableJson(a) === stableJson(b);
}

export function hasValidPreview(snapshot: WorkVersionSnapshot): boolean {
  return parseWorkPreview(snapshot.production.preview) !== null;
}

/** 仅当作品预览发生变化且新快照有效时，才追加版本节点 */
export function shouldAppendPreviewVersion(
  previous: WorkVersionSnapshot,
  next: WorkVersionSnapshot,
): boolean {
  return (
    stableJson(previous.production.preview) !==
      stableJson(next.production.preview) &&
    hasValidPreview(next)
  );
}

export function materializeWorkColumns(snapshot: WorkVersionSnapshot) {
  return {
    profile: snapshot.profile,
    references: snapshot.references,
    production: snapshot.production,
  };
}

export function previewVersionSummary(next: WorkVersionSnapshot): string {
  const preview = next.production.preview;
  return (
    preview?.title?.trim() ||
    previewPlainText(preview, 80) ||
    "生成作品预览"
  );
}
