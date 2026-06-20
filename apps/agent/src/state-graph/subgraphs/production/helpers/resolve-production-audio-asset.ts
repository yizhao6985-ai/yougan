import {
  assetFromUrl,
  inferMediaKind,
  type Asset,
  type HumanAttachmentAsset,
} from "@yougan/domain";

import { getLatestHumanMessageAttachments } from "#agent/messages/human.js";
import { getReferences } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

function attachmentToAsset(attachment: HumanAttachmentAsset): Asset {
  return assetFromUrl(attachment.url, {
    mime_type: attachment.mime_type,
    original_name: attachment.original_name,
  });
}

/** 优先取本轮 human 附件中的音频，否则取参考列表中最近一条音频素材。 */
export function resolveProductionAudioAsset(
  state: AgentStateType,
): Asset | null {
  const attachments = getLatestHumanMessageAttachments(state.messages);
  for (const attachment of attachments) {
    if (inferMediaKind(attachment.mime_type) === "audio") {
      return attachmentToAsset(attachment);
    }
  }

  const references = getReferences(state);
  for (let i = references.length - 1; i >= 0; i -= 1) {
    const ref = references[i];
    if (inferMediaKind(ref.asset.mime_type) === "audio") {
      return ref.asset;
    }
  }

  return null;
}
