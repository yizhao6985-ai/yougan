import type { MediaKind } from "@yougan/domain";

/** 分模态感知后的中间表示，供统一归纳 LLM 消费 */
export type ReferencePerceptionBundle = {
  media_kind: MediaKind | "text";
  user_context?: string | null;
  descriptor?: string;
  source_text?: string;
  transcript?: string;
  visual_description?: string;
  perception_notes?: string[];
};
