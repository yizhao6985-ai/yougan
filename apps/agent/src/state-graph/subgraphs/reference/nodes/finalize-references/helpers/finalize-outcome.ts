import {
  deriveReferenceDelta,
  isPendingReferenceIntent,
  PENDING_REFERENCE_INTENT_SUMMARY,
  type WorkReference,
} from "@yougan/domain";

const INTENT_SUMMARY_MAX_CHARS = 200;

export function resolveReferenceIntentSummary(ref: WorkReference): string {
  const userContext = ref.intent.user_context?.trim();
  if (userContext) {
    return userContext.length > INTENT_SUMMARY_MAX_CHARS
      ? `${userContext.slice(0, INTENT_SUMMARY_MAX_CHARS)}…`
      : userContext;
  }

  if (isPendingReferenceIntent(ref.intent)) {
    return PENDING_REFERENCE_INTENT_SUMMARY;
  }

  return ref.intent.summary.trim();
}

export function applyReferenceIntentFinalization(
  references: WorkReference[],
): WorkReference[] {
  return references.map((ref) => {
    const userContext = ref.intent.user_context?.trim();
    if (!userContext && !isPendingReferenceIntent(ref.intent)) {
      return ref;
    }

    return {
      ...ref,
      intent: { summary: resolveReferenceIntentSummary(ref) },
    };
  });
}
