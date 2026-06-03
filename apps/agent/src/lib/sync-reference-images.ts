import { HumanMessage } from "@langchain/core/messages";

import { createChatModel } from "#agent/llm/dashscope.js";
import type { ReferenceItem } from "#agent/schema.js";
import { truncateMessageContent } from "./message-content.js";
import { parseProfile } from "./parse-agent-state.js";
import { getLatestHumanMessageImageUrls } from "./human-message/index.js";
import {
  listKnownReferenceImageUrls,
  upsertImageReference,
} from "./reference-images.js";
import type { AgentStateType } from "#agent/state.js";

async function analyzeReferenceImage(
  imageUrl: string,
  hint = "",
): Promise<ReferenceItem> {
  const llm = createChatModel({ temperature: 0.2 });
  const response = await llm.invoke([
    new HumanMessage({
      content: [
        {
          type: "text",
          text: `描述这张参考图的风格、构图、色调，用于后续创作参考。${hint}`,
        },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    }),
  ]);

  return {
    source_type: "image",
    summary: truncateMessageContent(response.content),
    image_url: imageUrl,
  };
}

export async function syncReferenceImagesFromLatestMessage(
  state: AgentStateType,
): Promise<Partial<AgentStateType>> {
  const messageUrls = getLatestHumanMessageImageUrls(state.messages);
  if (messageUrls.length === 0) return {};

  const profile = parseProfile(state);
  const known = new Set(listKnownReferenceImageUrls(profile));
  const pending = messageUrls.filter((url) => !known.has(url));
  if (pending.length === 0) return {};

  let nextProfile = profile;
  for (const imageUrl of pending) {
    const item = await analyzeReferenceImage(imageUrl);
    nextProfile = upsertImageReference(nextProfile, item);
  }

  return { profile: nextProfile };
}
