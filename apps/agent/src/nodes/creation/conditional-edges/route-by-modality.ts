import {
  isValidMediaModality,
  resolveContentSpec,
  routeCreationPipeline,
  type CreationPipelineId,
} from "../../../lib/content-spec.js";
import { parseProfile } from "../../../lib/parse-agent-state.js";
import type { AgentStateType } from "../../../state.js";

/** creativeDirector 之后：按 media_modality 路由到 llmCall */
export const from = "creativeDirector" as const;

export function routeByModality(state: AgentStateType): CreationPipelineId {
  const profile = resolveContentSpec(parseProfile(state));
  const modality = profile.media_modality;
  return routeCreationPipeline(
    isValidMediaModality(modality) ? modality : null,
  );
}

export const paths = {
  text: "llmCall",
  image: "llmCall",
  audio: "llmCall",
  video: "llmCall",
} as const;
