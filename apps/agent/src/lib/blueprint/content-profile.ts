import type { WorkBlueprint, WorkProfile } from "@yougan/domain";
import { resolveContentSpec } from "../content-spec.js";

/** 从 blueprint 推导体裁路由用的 profile 视图 */
export function blueprintToContentProfile(blueprint: WorkBlueprint): WorkProfile {
  return resolveContentSpec({
    platform: blueprint.spec.platform,
    content_topic: blueprint.spec.content_topic,
    content_type: blueprint.spec.content_type,
    content_format: blueprint.spec.content_format,
    media_modality: blueprint.spec.media_modality,
    audience: blueprint.voice.audience,
    tone: blueprint.voice.tone,
    style: blueprint.voice.style,
    persona: blueprint.voice.persona,
    goals: blueprint.voice.goals,
  });
}
