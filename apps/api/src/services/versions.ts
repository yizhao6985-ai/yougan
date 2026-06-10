export {
  parseReferencesJson as parseReferences,
  parseProfileJson,
  parseProductionPlanJson,
  parseProductionPlanJson as parsePlan,
  parseReferencesJson,
  resolveProfileFromWork,
  resolveReferencesFromWork,
} from "@yougan/domain";

export {
  emptySnapshot,
  hasValidPreview,
  materializeWorkColumns,
  parseWorkPreview,
  parseWorkPreview as parsePreview,
  parseSnapshot,
  previewVersionSummary,
  shouldAppendPreviewVersion,
  snapshotFromAgentValues,
  snapshotsEqual,
} from "../lib/version-snapshot.js";
