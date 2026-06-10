import { assetFromUrl, referenceNeedsAnalysis, type Asset } from "@yougan/domain";
import type { AgentStateType } from "#agent/state.js";
import { getLatestHumanMessageAttachments } from "#agent/messages/human.js";
import { getReferences } from "#agent/state-io/index.js";

export function listNewReferenceAssets(state: AgentStateType): Asset[] {
  const references = getReferences(state);
  const messageAssets = getLatestHumanMessageAttachments(state.messages);
  const result: Asset[] = [];

  for (const raw of messageAssets) {
    const url = raw.url.trim();
    if (!url || !referenceNeedsAnalysis(url, references)) continue;

    result.push(
      assetFromUrl(url, {
        mime_type: raw.mime_type,
        original_name: raw.original_name,
      }),
    );
  }

  return result;
}
