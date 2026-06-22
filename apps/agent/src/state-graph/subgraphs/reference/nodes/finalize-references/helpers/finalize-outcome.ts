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

export function buildReferenceFinalizeMessage(
  delta: ReturnType<typeof deriveReferenceDelta>,
): string {
  const parts: string[] = [];

  if (delta.added.length > 0) {
    parts.push(
      delta.added.length > 1
        ? `已加入 ${delta.added.length} 项参考素材`
        : "已加入 1 项参考素材",
    );
  }

  if (delta.removed.length > 0) {
    parts.push(
      delta.removed.length > 1
        ? `已移除 ${delta.removed.length} 项参考素材`
        : "已移除 1 项参考素材",
    );
  }

  if (delta.toSummarize.length > 0) {
    parts.push(
      delta.toSummarize.length > 1
        ? `已记录 ${delta.toSummarize.length} 条借鉴说明`
        : "已记录 1 条借鉴说明",
    );
  }

  if (delta.toPrompt.length > 0) {
    parts.push(
      delta.toPrompt.length > 1
        ? `还有 ${delta.toPrompt.length} 条待说明如何借鉴，请补充想参考的风格、结构或语气`
        : "还有 1 条待说明如何借鉴，请补充想参考的风格、结构或语气",
    );
  }

  if (parts.length === 0) {
    return "参考素材暂无变更。";
  }

  return `${parts.join("。")}。请在侧栏「参考素材」查看详情。`;
}
