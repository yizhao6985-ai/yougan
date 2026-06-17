import {
  inferMediaKind,
  newWorkReference,
  pendingReferenceIntent,
  type Asset,
  type MediaKind,
  type WorkReference,
} from "@yougan/domain";

import { analyzeReferenceContent } from "./analyze/analyze-content.js";
import { prepareReferenceAsset } from "./prepare/prepare-asset.js";
import { upsertAssetReference } from "./upsert-asset-reference.js";
import { getReferences, getState } from "#agent/state-io/index.js";

export async function executeReferencePreprocess(
  asset: Asset,
  expectedKind: MediaKind,
): Promise<
  | { ok: true; summary: string; references: WorkReference[] }
  | { ok: false; message: string }
> {
  const kind = inferMediaKind(asset.mime_type);
  if (kind !== expectedKind) {
    return {
      ok: false,
      message: `资源类型为 ${kind}，请改用对应预处理工具。`,
    };
  }

  const state = getState();
  const prep = await prepareReferenceAsset(asset);
  const analysis = await analyzeReferenceContent(prep);
  const reference = newWorkReference({
    asset,
    analysis,
    intent: pendingReferenceIntent(),
    analyzed_at: new Date().toISOString(),
  });

  let references = getReferences(state);
  references = upsertAssetReference(references, reference);

  return {
    ok: true,
    summary: analysis.summary.trim(),
    references,
  };
}
