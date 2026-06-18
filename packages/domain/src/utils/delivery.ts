import {
  CONTENT_FORMATS,
  type ContentFormatId,
  type MediaModalityId,
} from "../models/taxonomy/content.js";
import type { DeliverySpec } from "../models/work/profile.js";
import {
  inferFormatFromModalities,
  syncModalitiesWithFormat,
} from "./work/delivery-media-params.js";

const FORMAT_IDS = new Set<string>(CONTENT_FORMATS.map((item) => item.id));

export function isValidContentFormat(
  value: string | null | undefined,
): value is ContentFormatId {
  return Boolean(value && FORMAT_IDS.has(value));
}

/** 补齐缺失或无效的 format / modalities（仅制作/发布等运行时推断，不写入 profile） */
export function resolveDelivery(delivery: DeliverySpec): ResolvedDelivery {
  const modalities = syncModalitiesWithFormat(
    delivery.format,
    delivery.modalities ?? [],
  );
  const format = isValidContentFormat(delivery.format)
    ? delivery.format
    : inferFormatFromModalities(modalities, null);

  return {
    format,
    modalities,
  };
}

export type ResolvedDelivery = DeliverySpec & {
  modalities: MediaModalityId[];
  format: ContentFormatId;
};

export {
  defaultMediaParamsForFormat,
  inferFormatFromModalities,
  mergeDeliveryMediaParams,
  parseDeliveryMediaParams,
  syncModalitiesWithFormat,
} from "./work/delivery-media-params.js";
