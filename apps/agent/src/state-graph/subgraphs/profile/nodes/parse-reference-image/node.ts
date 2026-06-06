/** work node：解析参考图写入 references */
import { HumanMessage } from "@langchain/core/messages";

import { humanImageFromUrl } from "#agent/messages/content-parts.js";

import { invokeStructured } from "#agent/llm/invoke/index.js";
import { createChatModel } from "#agent/llm/providers/index.js";
import type { ReferenceItem } from "@yougan/domain";
import {
  patchPendingProfile,
  patchPendingProfileMeta,
} from "#agent/state-io/index.js";
import { getProfile, getProfileStagingMeta } from "#agent/state-io/index.js";
import type { AgentStateType } from "#agent/state.js";

import { upsertImageReference } from "./helpers/reference-images.js";
import { buildParseReferenceImagePrompt } from "./prompt.js";
import { ReferenceImageParseSchema } from "./schema.js";

export async function parseReferenceImageNode(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const pending = getProfileStagingMeta(state).pendingParseReferenceImage;
  if (!pending?.image_url) return {};

  const llm = createChatModel({ temperature: 0.2 });
  const parsed = await invokeStructured(
    llm,
    ReferenceImageParseSchema,
    [
      new HumanMessage({
        content: [
          {
            type: "text",
            text: buildParseReferenceImagePrompt(pending.hint),
          },
          humanImageFromUrl(pending.image_url),
        ],
      }),
    ],
    { name: "parse_reference_image" },
  );

  const item: ReferenceItem = {
    source_type: "image",
    summary: parsed.summary,
    tone_hints: parsed.tone_hints,
    structure_hints: parsed.structure_hints,
    image_url: pending.image_url,
  };

  const profile = getProfile(state);
  const nextReferences = upsertImageReference(profile.references, item);
  return {
    ...patchPendingProfile(state, { ...profile, references: nextReferences }),
    ...patchPendingProfileMeta(state, { pendingParseReferenceImage: null }),
  };
}
