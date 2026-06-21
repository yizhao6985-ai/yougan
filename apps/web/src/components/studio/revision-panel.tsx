import type {
  WorkPreview,
  WorkRevision,
  RevisionAnchor,
  RevisionIntentSource,
} from "@yougan/domain";
import {
  appendRevisionIntent,
  withdrawRevisionIntent,
} from "@yougan/domain";

export function buildRevisionWithNewIntent(
  revision: WorkRevision | null | undefined,
  input: {
    instruction: string;
    anchor?: RevisionAnchor | null;
    source?: RevisionIntentSource;
  },
): WorkRevision {
  const base = revision ?? { status: "collecting" as const, items: [] };
  return appendRevisionIntent(base, input);
}

export function buildRevisionWithoutIntent(
  revision: WorkRevision | null | undefined,
  intentId: string,
): WorkRevision {
  const base = revision ?? { status: "collecting" as const, items: [] };
  return withdrawRevisionIntent(base, intentId);
}

export type { WorkPreview };
