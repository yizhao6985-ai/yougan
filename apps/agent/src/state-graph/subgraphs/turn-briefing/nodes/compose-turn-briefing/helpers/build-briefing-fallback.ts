import {
  deriveReferenceDelta,
  previewHasContent,
  previewPlainText,
  type TurnQueueKind,
} from "@yougan/domain";

import type { AgentStateType } from "#agent/state.js";
import {
  getPreview,
  getProduction,
  getProfile,
  getReferences,
  getRevision,
} from "#agent/state-io/index.js";
import { getTurn } from "#agent/state-io/turn.js";

import { firstProductionFailureMessage } from "../../../../production/helpers/task-plan.js";
import {
  buildCollectRevisionImpact,
  revisionTurnHadChanges,
} from "./collect-revision-impact.js";
import {
  buildProfileImpactLines,
  profileTurnHadChanges,
} from "./profile-impact.js";
import { completedBriefingKindsForPrompt } from "./briefing-context.js";

export type TurnBriefingFallback = {
  effectSummary: string;
  excerpt: string | null;
};

function completedReflectableKinds(state: AgentStateType): TurnQueueKind[] {
  return completedBriefingKindsForPrompt(state);
}

function referenceHadChanges(state: AgentStateType): boolean {
  const delta = deriveReferenceDelta(
    state.references ?? [],
    getReferences(state),
  );
  return (
    delta.added.length > 0 ||
    delta.removed.length > 0 ||
    delta.toSummarize.length > 0 ||
    delta.toPrompt.length > 0
  );
}

function productionHadChanges(state: AgentStateType): boolean {
  const before = state.production;
  const after = getProduction(state);
  const previewBefore = state.preview;
  const previewAfter = getPreview(state);
  return (
    JSON.stringify(before) !== JSON.stringify(after) ||
    JSON.stringify(previewBefore) !== JSON.stringify(previewAfter)
  );
}

export function shouldComposeTurnBriefing(state: AgentStateType): boolean {
  if (getTurn(state).cancelled) return false;

  const kinds = completedReflectableKinds(state);
  if (kinds.length === 0) return false;

  if (
    kinds.includes("profile") &&
    profileTurnHadChanges(state.profile, getProfile(state))
  ) {
    return true;
  }
  if (kinds.includes("reference") && referenceHadChanges(state)) {
    return true;
  }
  if (kinds.includes("production") && productionHadChanges(state)) {
    return true;
  }
  if (
    kinds.includes("collectRevision") &&
    revisionTurnHadChanges(state.revision, getRevision(state))
  ) {
    return true;
  }
  if (kinds.includes("revise") && productionHadChanges(state)) {
    return true;
  }

  return false;
}

function buildReferenceImpact(
  state: AgentStateType,
): TurnBriefingFallback | null {
  if (!referenceHadChanges(state)) return null;

  const delta = deriveReferenceDelta(
    state.references ?? [],
    getReferences(state),
  );
  const lines: string[] = [];

  if (delta.added.length > 0) {
    lines.push("新参考会进入后续创作的语境，影响结构与表达取向");
  }
  if (delta.removed.length > 0) {
    lines.push("已移除的参考不再约束后续成稿");
  }
  if (delta.toSummarize.length > 0) {
    lines.push("你写的借鉴方式会具体决定哪些元素被沿用");
  }
  if (delta.toPrompt.length > 0) {
    lines.push("尚未说明借鉴方式的参考，对成稿的拉动会偏弱");
  }

  if (lines.length === 0) return null;
  return { effectSummary: lines.join("。") + "。", excerpt: null };
}

function buildProfileImpact(state: AgentStateType): TurnBriefingFallback | null {
  if (!profileTurnHadChanges(state.profile, getProfile(state))) {
    return null;
  }

  const lines = buildProfileImpactLines({
    before: state.profile,
    after: getProfile(state),
    preview: getPreview(state),
    production: getProduction(state),
  });

  if (lines.length === 0) return null;
  return { effectSummary: lines.join("。") + "。", excerpt: null };
}

function buildProductionImpact(
  state: AgentStateType,
): TurnBriefingFallback | null {
  if (!productionHadChanges(state)) return null;

  const production = getProduction(state);
  const preview = getPreview(state);

  if (preview != null && previewHasContent(preview)) {
    const plain = previewPlainText(preview, 1200);
    const title = preview.title?.trim();
    const titleBlock = title ? `${title}\n\n` : "";
    return {
      effectSummary:
        "按当前方案，这一版成稿的正文与结构已经落地，可作为发布底稿或继续改稿的起点",
      excerpt: `${titleBlock}${plain || "（以配图/音视频为主）"}`,
    };
  }

  const failureMessage = firstProductionFailureMessage(production);
  if (failureMessage) {
    return {
      effectSummary: `创作未产出可用成稿（${failureMessage}），现有作品面板内容不会更新`,
      excerpt: null,
    };
  }

  if (production.pending_tasks.length === 0) {
    return {
      effectSummary: "方案或计划仍不足以驱动创作，成稿内容不会变化",
      excerpt: null,
    };
  }

  return null;
}

function buildReviseImpact(state: AgentStateType): TurnBriefingFallback | null {
  if (!productionHadChanges(state)) return null;

  const preview = getPreview(state);
  if (!previewHasContent(preview)) {
    return {
      effectSummary:
        "改稿意图已反映到成稿的非文字部分（配图/音视频），正文结构不变",
      excerpt: null,
    };
  }

  const excerpt = previewPlainText(preview, 800);
  return {
    effectSummary: "改稿后，成稿正文与表达应与清单中的意图一致，主要变化如下",
    excerpt: excerpt || "（以配图/音视频为主）",
  };
}

function buildImpactForKind(
  state: AgentStateType,
  kind: TurnQueueKind,
): TurnBriefingFallback | null {
  switch (kind) {
    case "reference":
      return buildReferenceImpact(state);
    case "profile":
      return buildProfileImpact(state);
    case "collectRevision":
      return buildCollectRevisionImpact({
        before: state.revision,
        after: getRevision(state),
      });
    case "revise":
      return buildReviseImpact(state);
    case "production":
      return buildProductionImpact(state);
    default:
      return null;
  }
}

function mergeBriefingFallbackParts(
  parts: TurnBriefingFallback[],
): TurnBriefingFallback | null {
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0]!;

  const effectSummary =
    parts
      .map((part) => part.effectSummary.replace(/。$/, ""))
      .join("。") + "。";
  const excerpt =
    parts.map((part) => part.excerpt?.trim()).find(Boolean) ?? null;

  return { effectSummary, excerpt };
}

export function buildTurnBriefingFallback(
  state: AgentStateType,
): TurnBriefingFallback | null {
  if (!shouldComposeTurnBriefing(state)) return null;

  const kinds = completedReflectableKinds(state);
  const parts = kinds
    .map((kind) => buildImpactForKind(state, kind))
    .filter((part): part is TurnBriefingFallback => part != null);

  return mergeBriefingFallbackParts(parts);
}
