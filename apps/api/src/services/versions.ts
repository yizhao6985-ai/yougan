export {
  parseReferencesJson as parseReferences,
  parseProfileJson,
  parseProductionJson,
  parseProductionJson as parseProduction,
  parseReferencesJson,
  parseRevisionJson,
  parseWorkPreview,
  parseWorkPreview as parsePreview,
  resolvePreviewFromWork,
  resolveProfileFromWork,
  resolveReferencesFromWork,
} from "@yougan/domain";

export {
  emptySnapshot,
  hasValidPreview,
  materializeWorkColumns,
  materializeAgentWorkColumns,
  parseSnapshot,
  previewVersionSummary,
  shouldAppendPreviewVersion,
  snapshotFromAgentValues,
  snapshotsEqual,
} from "../lib/version-snapshot.js";
