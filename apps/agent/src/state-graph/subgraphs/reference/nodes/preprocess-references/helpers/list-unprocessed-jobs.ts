import {
  assetFromUrl,
  inferMediaKind,
  referenceNeedsAnalysis,
  type MediaKind,
} from "@yougan/domain";

import { getLatestHumanMessageAttachments } from "#agent/messages/human.js";
import { getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

export type UnprocessedReferenceJob = {
  asset_url: string;
  mime_type: string;
  media_kind: MediaKind;
  reference_id?: string;
  original_name?: string;
};

export function listUnprocessedReferenceJobs(
  state: AgentStateType,
): UnprocessedReferenceJob[] {
  const references = getReferences(state);
  const jobs: UnprocessedReferenceJob[] = [];
  const seenUrls = new Set<string>();

  for (const ref of references) {
    if (ref.analysis.summary.trim()) continue;
    const url = ref.asset.url.trim();
    if (!url || seenUrls.has(url)) continue;
    seenUrls.add(url);
    jobs.push({
      asset_url: url,
      mime_type: ref.asset.mime_type,
      media_kind: inferMediaKind(ref.asset.mime_type),
      reference_id: ref.id,
      original_name: ref.asset.original_name ?? undefined,
    });
  }

  for (const raw of getLatestHumanMessageAttachments(state.messages)) {
    const url = raw.url.trim();
    if (!url || seenUrls.has(url)) continue;
    if (!referenceNeedsAnalysis(url, references)) continue;
    seenUrls.add(url);
    const mime =
      raw.mime_type?.trim() || assetFromUrl(url).mime_type;
    jobs.push({
      asset_url: url,
      mime_type: mime,
      media_kind: inferMediaKind(mime),
      original_name: raw.original_name ?? undefined,
    });
  }

  return jobs;
}
