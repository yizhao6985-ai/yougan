export {
  parseReferencesJson as parseReferences,
  parseProfileJson,
  parseProductionJson,
  parseProductionJson as parseProduction,
  parseReferencesJson,
  parseWorkPreview,
  parseWorkPreview as parsePreview,
  resolveProfileFromWork,
  resolveReferencesFromWork,
} from "@yougan/domain";

export {
  emptySnapshot,
  hasValidPreview,
  materializeWorkColumns,
  parseSnapshot,
  previewVersionSummary,
  shouldAppendPreviewVersion,
  snapshotFromAgentValues,
  snapshotsEqual,
} from "../lib/version-snapshot.js";
