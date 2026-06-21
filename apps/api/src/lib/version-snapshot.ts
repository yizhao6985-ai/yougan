import {
  EMPTY_WORK_PRODUCTION,
  EMPTY_WORK_PROFILE,
  EMPTY_WORK_REFERENCES,
  parseProductionFromLegacyFields,
  parseProductionJson,
  parseProfileJson,
  parseReferencesJson,
  parseRevisionJson,
  parseWorkPreview,
  previewPlainText,
  resolvePreviewFromWork,
  resolveReferencesFromWork,
  type WorkVersionSnapshot,
} from "@yougan/domain";

export function emptySnapshot(): WorkVersionSnapshot {
  return {
    profile: { ...EMPTY_WORK_PROFILE },
    references: [...EMPTY_WORK_REFERENCES],
    preview: null,
    production: { ...EMPTY_WORK_PRODUCTION },
  };
}

function resolveSnapshotPreview(raw: Record<string, unknown>) {
  return resolvePreviewFromWork({
    preview: raw.preview,
    production: raw.production,
  });
}

export function parseSnapshot(raw: unknown): WorkVersionSnapshot {
  if (!raw || typeof raw !== "object") return emptySnapshot();
  const value = raw as Record<string, unknown>;
  const production = parseProductionFromLegacyFields({
    production: value.production,
    productionPlan: value.productionPlan,
  });
  return {
    profile: parseProfileJson(value.profile),
    references:
      value.references !== undefined
        ? parseReferencesJson(value.references)
        : [],
    preview: resolveSnapshotPreview(value),
    production,
  };
}

export function snapshotFromAgentValues(
  values: Record<string, unknown>,
): WorkVersionSnapshot {
  const production = parseProductionJson(values.production);
  const preview =
    values.preview !== undefined
      ? parseWorkPreview(values.preview)
      : resolvePreviewFromWork({
          preview: undefined,
          production: values.production,
        });
  return {
    profile: parseProfileJson(values.profile),
    references: resolveReferencesFromWork({
      references: values.references,
    }),
    preview,
    production,
  };
}

/** Agent run 物化列（含 revision，不进版本快照比较） */
export function materializeAgentWorkColumns(values: Record<string, unknown>) {
  const snapshot = snapshotFromAgentValues(values);
  return {
    ...materializeWorkColumns(snapshot),
    revision: parseRevisionJson(values.revision),
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
  return parseWorkPreview(snapshot.preview) !== null;
}

/** 仅当作品 preview 发生变化且新快照有效时，才追加版本节点 */
export function shouldAppendPreviewVersion(
  previous: WorkVersionSnapshot,
  next: WorkVersionSnapshot,
): boolean {
  return (
    stableJson(previous.preview) !== stableJson(next.preview) &&
    hasValidPreview(next)
  );
}

export function materializeWorkColumns(snapshot: WorkVersionSnapshot) {
  return {
    profile: snapshot.profile,
    references: snapshot.references,
    preview: snapshot.preview,
    production: snapshot.production,
  };
}

export function previewVersionSummary(next: WorkVersionSnapshot): string {
  const preview = next.preview;
  return (
    preview?.title?.trim() ||
    previewPlainText(preview, 80) ||
    "生成作品预览"
  );
}
