import {
  CONTENT_FORMATS,
  type ContentFormatId,
} from "../models/content-form/formats.js";
import type { MediaModalityId } from "../models/content-form/modalities.js";
import type { ContentFormSpec } from "../models/work/profile.js";
import {
  inferFormatFromModalities,
  syncModalitiesWithFormat,
} from "./work/content-form-media-params.js";

const FORMAT_IDS = new Set<string>(CONTENT_FORMATS.map((item) => item.id));

export function isValidContentFormat(
  value: string | null | undefined,
): value is ContentFormatId {
  return Boolean(value && FORMAT_IDS.has(value));
}

/** 补齐缺失或无效的 format / modalities（仅制作/发布等运行时推断，不写入 profile） */
export function resolveContentForm(spec: ContentFormSpec): ResolvedContentForm {
  const modalities = syncModalitiesWithFormat(
    spec.format,
    spec.modalities ?? [],
  );
  const format = isValidContentFormat(spec.format)
    ? spec.format
    : inferFormatFromModalities(modalities, null);

  return {
    format,
    modalities,
  };
}

export type ResolvedContentForm = ContentFormSpec & {
  modalities: MediaModalityId[];
  format: ContentFormatId;
};

export {
  defaultMediaParamsForFormat,
  inferFormatFromModalities,
  mergeContentFormMediaParams,
  parseContentFormMediaParams,
  syncModalitiesWithFormat,
} from "./work/content-form-media-params.js";
