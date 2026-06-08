import {
  assetFromUrl,
  type Asset,
  type ReferenceContent,
  type WorkReference,
} from "@yougan/domain";
import type { AgentStateType } from "#agent/state.js";
import {
  getLatestHumanMessageAttachments,
  getLatestHumanMessageText,
} from "#agent/messages/human.js";
import { getReferences } from "#agent/state-io/index.js";

import {
  listKnownReferenceAssetUrls,
  resolveReferenceAssetUrl,
} from "./resolve-asset-url.js";

export type ReferenceAnalyzeRequest = {
  content: ReferenceContent;
  user_context?: string | null;
};

export function shouldAnalyzeAttachment(
  references: WorkReference[],
  url: string,
  userContext: string | null,
): boolean {
  const existing = references.find(
    (item) => item.content.kind === "asset" && item.content.asset.url === url,
  );
  if (!existing?.analysis.summary.trim()) return true;
  return Boolean(userContext?.trim());
}

export function listAttachmentAnalyzeRequests(
  state: AgentStateType,
): ReferenceAnalyzeRequest[] {
  const references = getReferences(state);
  const messageAssets = getLatestHumanMessageAttachments(state.messages);
  if (!messageAssets.length) return [];

  const userContext = getLatestHumanMessageText(state.messages).trim() || null;
  const knownUrls = listKnownReferenceAssetUrls(references);
  const messageUrls = messageAssets.map((item) => item.url);

  const requests: ReferenceAnalyzeRequest[] = [];
  for (const raw of messageAssets) {
    const resolvedUrl = resolveReferenceAssetUrl(
      raw.url,
      messageUrls,
      knownUrls,
    );
    if (!resolvedUrl) continue;
    if (!shouldAnalyzeAttachment(references, resolvedUrl, userContext)) {
      continue;
    }

    const asset: Asset = assetFromUrl(resolvedUrl, {
      mime_type:
        raw.mime_type && raw.mime_type !== "image/*"
          ? raw.mime_type
          : undefined,
      original_name: raw.original_name,
    });
    requests.push({
      content: { kind: "asset", asset },
      user_context: userContext,
    });
  }

  return requests;
}
