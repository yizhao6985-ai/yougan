import { assetFromUrl, type Asset, type WorkReference } from "@yougan/domain";
import type { AgentStateType } from "#agent/state.js";
import {
  getLatestHumanMessageAttachments,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import { getReferences } from "#agent/state-io/index.js";

export type ReferenceAnalyzeRequest = {
  asset: Asset;
  user_context?: string | null;
};

export function shouldAnalyzePendingReference(
  references: WorkReference[],
  url: string,
  userContext: string | null,
): boolean {
  const existing = references.find((item) => item.asset.url === url);
  if (!existing?.analysis.summary.trim()) return true;
  return Boolean(userContext?.trim());
}

export function listPendingAnalyzeRequests(
  state: AgentStateType,
): ReferenceAnalyzeRequest[] {
  const references = getReferences(state);
  const messageAssets = getLatestHumanMessageAttachments(state.messages);
  if (!messageAssets.length) return [];

  const userContext = getLatestHumanMessageText(state.messages).trim() || null;

  const requests: ReferenceAnalyzeRequest[] = [];
  for (const raw of messageAssets) {
    const url = raw.url.trim();
    if (!url) continue;
    if (!shouldAnalyzePendingReference(references, url, userContext)) {
      continue;
    }

    requests.push({
      asset: assetFromUrl(url, {
        mime_type: raw.mime_type,
        original_name: raw.original_name,
      }),
      user_context: userContext,
    });
  }

  return requests;
}
