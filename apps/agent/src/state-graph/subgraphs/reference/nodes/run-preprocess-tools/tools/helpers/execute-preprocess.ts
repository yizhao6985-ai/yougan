import {
  assetFromUrl,
  inferMediaKind,
  newWorkReference,
  pendingReferenceIntent,
  type Asset,
  type MediaKind,
} from "@yougan/domain";

import { analyzeReferenceContent } from "./analyze/analyze-content.js";
import { prepareReferenceIngest } from "./prepare/prepare-asset.js";
import { upsertAssetReference } from "./upsert-asset-reference.js";
import {
  getReferences,
  getState,
  patchPendingReferences,
} from "#agent/state-io/index.js";

export async function executeReferencePreprocess(
  asset: Asset,
  expectedKind: MediaKind,
): Promise<{ ok: true; summary: string } | { ok: false; message: string }> {
  const kind = inferMediaKind(asset.mime_type);
  if (kind !== expectedKind) {
    return {
      ok: false,
      message: `资源类型为 ${kind}，请改用对应预处理工具。`,
    };
  }

  const state = getState();
  const prep = await prepareReferenceIngest({ asset });
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
  };
}

export function assetFromPreprocessInput(input: {
  asset_url: string;
  mime_type?: string;
  original_name?: string;
}): Asset {
  const url = input.asset_url.trim();
  return assetFromUrl(url, {
    mime_type: input.mime_type,
    original_name: input.original_name,
  });
}

export function patchAfterPreprocess(summary: string) {
  const state = getState();
  const references = getReferences(state);
  return {
    ...patchPendingReferences(state, references),
    message: `已完成预处理：${summary.slice(0, 160)}${summary.length > 160 ? "…" : ""}`,
  };
}
