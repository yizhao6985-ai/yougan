import {
  CONTENT_FORMATS,
  type ContentFormatId,
  type MediaModalityId,
} from "../models/taxonomy/content.js";
import type { WorkProfile } from "../models/work/profile.js";
import { resolveDeliveryFromProfile } from "./work/profile.js";
import {
  mediaModalitiesLabel,
  mediaModalityLabel,
  normalizeMediaModalities,
  routeProductionPipeline,
  sortMediaModalities,
  type ProductionPipelineId,
} from "./media-modalities.js";

const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((item) => [item.id, item.label]),
) as Record<ContentFormatId, string>;

export { type ProductionPipelineId, routeProductionPipeline };

export function contentFormatLabel(id: string | null | undefined) {
  if (!id) return null;
  return FORMAT_LABELS[id as ContentFormatId] ?? id;
}

export {
  mediaModalityLabel,
  mediaModalitiesLabel,
  normalizeMediaModalities,
  sortMediaModalities,
};

export function deliverySummary(profile: WorkProfile) {
  const delivery = resolveDeliveryFromProfile(profile);
  const format = contentFormatLabel(delivery.format);
  const modalities = mediaModalitiesLabel(delivery.modalities);
  const parts = [
    delivery.topic ? `主题：${delivery.topic}` : null,
    delivery.intent ? `原话：${delivery.intent}` : null,
    format ? `体裁：${format}` : null,
    modalities ? `形式：${modalities}` : null,
    delivery.platform ? `平台：${delivery.platform}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定创作规格";
}

/** @deprecated Use deliverySummary */
export function contentSpecSummary(spec: {
  content_format?: string | null;
  media_modalities?: MediaModalityId[];
  content_type?: string | null;
}) {
  const format = contentFormatLabel(spec.content_format);
  const modalities = mediaModalitiesLabel(spec.media_modalities);
  const parts = [
    format ? `体裁：${format}` : null,
    modalities ? `形式：${modalities}` : null,
    spec.content_type ? `类型描述：${spec.content_type}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定体裁与形式";
}

/** @deprecated Use resolveDeliveryFromProfile */
export function resolveContentSpecFromProfile(profile: WorkProfile) {
  const delivery = resolveDeliveryFromProfile(profile);
  return {
    platform: delivery.platform,
    content_topic: delivery.topic,
    content_type: delivery.intent,
    content_format: delivery.format,
    media_modalities: delivery.modalities,
  };
}
