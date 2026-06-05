/** work node：解析参考图写入 references */
import { HumanMessage } from "@langchain/core/messages";

import { createChatModel } from "#agent/model/dashscope.js";
import { truncateMessageContent, type ReferenceItem } from "@yougan/domain";
import {
  patchStagingProfile,
  patchStagingProfileMeta,
} from "#agent/runtime/staging-writes.js";
import { parseProfile } from "#agent/runtime/state-readers.js";
import type { AgentStateType } from "#agent/state.js";

import { upsertImageReference } from "../../helpers/reference-images.js";
import { buildParseReferenceImagePrompt } from "./prompt.js";

export async function parseReferenceImageNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const pending = state.staging?.meta.profile?.pendingParseReferenceImage;
  if (!pending?.image_url) return {};

  const llm = createChatModel({ temperature: 0.2 });
  const response = await llm.invoke([
    new HumanMessage({
      content: [
        {
          type: "text",
          text: buildParseReferenceImagePrompt(pending.hint),
        },
        { type: "image_url", image_url: { url: pending.image_url } },
      ],
    }),
  ]);
  const summary = truncateMessageContent(response.content);
  const item: ReferenceItem = {
    source_type: "image",
    summary,
    image_url: pending.image_url,
  };

  const profile = parseProfile(state);
  const nextReferences = upsertImageReference(profile.references, item);
  return {
    ...patchStagingProfile(state, { ...profile, references: nextReferences }),
    ...patchStagingProfileMeta(state, { pendingParseReferenceImage: null }),
  };
}
