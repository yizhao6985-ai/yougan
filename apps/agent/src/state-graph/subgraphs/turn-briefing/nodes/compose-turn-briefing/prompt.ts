import {
  deriveReferenceDelta,
  previewHasContent,
  previewPlainText,
  type TurnQueueKind,
} from "@yougan/domain";

import { getLatestHumanMessageText } from "#agent/messages/human.js";
import {
  profileSummary,
  profileReferencesSummary,
} from "#agent/prompts/profile-summary.js";
import {
  getPreview,
  getProduction,
  getProfile,
  getReferences,
  getRevision,
} from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { completedBriefingKindsForPrompt } from "./helpers/briefing-context.js";
import { revisionItemsForImpact } from "./helpers/collect-revision-impact.js";
import {
  detectProfileChangedSections,
  buildProfileImpactLines,
} from "./helpers/profile-impact.js";

const KIND_LABELS: Record<TurnQueueKind, string> = {
  reference: "参考素材",
  profile: "制作方案",
  production: "创作出稿",
  collectRevision: "收集改稿意见",
  revise: "执行改稿",
  ask: "答疑",
};

function formatRevisionItemsForPrompt(state: AgentStateType): string {
  const items = revisionItemsForImpact(state.revision, getRevision(state));
  if (items.length === 0) return "（本轮未新增改稿条目）";

  return items
    .map((item, index) => {
      const quote = item.anchor?.quote?.trim();
      const instruction = item.instruction.trim();
      if (quote) {
        return `${index + 1}. 原文：「${quote.slice(0, 120)}」\n   改法：${instruction}`;
      }
      return `${index + 1}. 整体：${instruction}`;
    })
    .join("\n");
}

function formatReferenceDeltaForPrompt(state: AgentStateType): string {
  const delta = deriveReferenceDelta(
    state.references ?? [],
    getReferences(state),
  );
  const parts: string[] = [];
  if (delta.added.length) parts.push(`新增 ${delta.added.length} 条`);
  if (delta.removed.length) parts.push(`移除 ${delta.removed.length} 条`);
  if (delta.toSummarize.length) {
    parts.push(`本轮补充借鉴说明 ${delta.toSummarize.length} 条`);
  }
  if (delta.toPrompt.length) {
    parts.push(`仍待说明借鉴方式 ${delta.toPrompt.length} 条`);
  }
  return parts.length ? parts.join("；") : "（无实质变更）";
}

function formatDirectionsForPrompt(state: AgentStateType): string {
  const directions = state.turnDirections?.directions ?? [];
  if (directions.length === 0) return "（暂无延伸方向）";

  return directions
    .map(
      (direction, index) =>
        `${index + 1}. ${direction.label}\n   outcome：${direction.outcome}\n   prompt：${direction.prompt}`,
    )
    .join("\n\n");
}

export function buildComposeTurnBriefingPrompt(state: AgentStateType): string {
  const kinds = completedBriefingKindsForPrompt(state);
  const userMessage = getLatestHumanMessageText(state.messages).trim();
  const profileAfter = getProfile(state);
  const profileBefore = state.profile;
  const preview = getPreview(state);
  const references = getReferences(state);

  const changedSections = detectProfileChangedSections(
    profileBefore,
    profileAfter,
  );
  const profileImpactHints = buildProfileImpactLines({
    before: profileBefore,
    after: profileAfter,
    preview,
    production: getProduction(state),
  });

  const previewBlock = previewHasContent(preview)
    ? previewPlainText(preview, 600)
    : "（尚无可用成稿）";

  return `请根据以下回合上下文，撰写「回合简报」（turn_briefing）。

## 输出结构（必须两段，用空行分隔）
**第一段 · 本轮效果**：1–3 句，评鉴感友上一步操作对成稿/制作方案的实际影响；不复述系统已完成操作
**第二段 · 可继续的方向**：逐条对应下方延伸方向（1:1，不得自创新方向）；每条用「· 标题：效果说明」格式，可润色 outcome 但不可改变含义

## 禁止
已更新、已记入、已写入、已就绪、请到面板查看；不要 JSON

## 本轮执行的步骤
${kinds.map((kind) => `- ${KIND_LABELS[kind]}`).join("\n")}

## 感友原话
${userMessage || "（无文字）"}

## 方案变更
变更块：${changedSections.length ? changedSections.join("、") : "无"}
变更前摘要：
${profileSummary(profileBefore, state.references ?? [])}

变更后摘要：
${profileSummary(profileAfter, references)}

规则层影响提示（可改写，勿照抄操作句）：
${profileImpactHints.length ? profileImpactHints.map((line) => `- ${line}`).join("\n") : "（无）"}

## 参考素材变更
${formatReferenceDeltaForPrompt(state)}
当前参考：
${profileReferencesSummary(references)}

## 改稿清单（本轮相关条目）
${formatRevisionItemsForPrompt(state)}

## 当前成稿节选
${previewBlock}

## 延伸方向（第二段须逐条对应）
${formatDirectionsForPrompt(state)}`;
}
