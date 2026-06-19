import type { MediaModalityId } from "../../models/content-form/modalities.js";
import { MEDIA_MODALITIES } from "../../models/content-form/modalities.js";
import type { ContentFormMediaParams } from "../../models/work/profile.js";

const MODALITY_LABELS = Object.fromEntries(
  MEDIA_MODALITIES.map((item) => [item.id, item.label]),
) as Record<MediaModalityId, string>;

export type ContentFormModalitySpecRow = {
  label: string;
  value: string;
};

export type ContentFormModalitySpecSection = {
  modality: MediaModalityId;
  title: string;
  rows: ContentFormModalitySpecRow[];
};

/** 仅保留当前 modalities 对应的 media_params 键，并为缺失键补空对象 */
export function syncMediaParamsWithModalities(
  modalities: MediaModalityId[],
  media_params: ContentFormMediaParams = {},
): ContentFormMediaParams {
  const set = new Set(modalities);
  const next: ContentFormMediaParams = {};
  if (set.has("text")) next.text = media_params.text ?? {};
  if (set.has("image")) next.image = media_params.image ?? {};
  if (set.has("video")) next.video = media_params.video ?? {};
  if (set.has("audio")) next.audio = media_params.audio ?? {};
  return next;
}

function textSpecRows(
  params: ContentFormMediaParams["text"],
): ContentFormModalitySpecRow[] {
  if (!params) return [];
  const rows: ContentFormModalitySpecRow[] = [];
  const { min, max } = params.word_count ?? {};
  if (min != null || max != null) {
    const parts = [
      min != null ? `最少 ${min} 字` : null,
      max != null ? `最多 ${max} 字` : null,
    ].filter(Boolean);
    rows.push({ label: "字数", value: parts.join("，") });
  }
  if (params.emoji_level) {
    const labels = { none: "不用", light: "少量", heavy: "较多" } as const;
    rows.push({ label: "Emoji", value: labels[params.emoji_level] });
  }
  return rows;
}

function imageSpecRows(
  params: ContentFormMediaParams["image"],
): ContentFormModalitySpecRow[] {
  if (!params?.aspect_ratio) return [];
  return [{ label: "画幅", value: params.aspect_ratio }];
}

function videoSpecRows(
  params: ContentFormMediaParams["video"],
): ContentFormModalitySpecRow[] {
  if (!params) return [];
  const rows: ContentFormModalitySpecRow[] = [];
  if (params.duration_sec != null) {
    rows.push({ label: "时长", value: `${params.duration_sec} 秒` });
  }
  if (params.aspect_ratio) rows.push({ label: "画幅", value: params.aspect_ratio });
  if (params.pacing) rows.push({ label: "节奏", value: params.pacing });
  return rows;
}

function audioSpecRows(
  params: ContentFormMediaParams["audio"],
): ContentFormModalitySpecRow[] {
  if (params?.duration_sec == null) return [];
  return [{ label: "时长", value: `${params.duration_sec} 秒` }];
}

const SPEC_ROW_BUILDERS: Record<
  MediaModalityId,
  (params: ContentFormMediaParams) => ContentFormModalitySpecRow[]
> = {
  text: (mp) => textSpecRows(mp.text),
  image: (mp) => imageSpecRows(mp.image),
  video: (mp) => videoSpecRows(mp.video),
  audio: (mp) => audioSpecRows(mp.audio),
};

/** 按媒介拆分规格展示（混排时每媒介一节） */
export function buildContentFormModalitySpecSections(input: {
  modalities: MediaModalityId[];
  media_params: ContentFormMediaParams;
}): ContentFormModalitySpecSection[] {
  const media_params = syncMediaParamsWithModalities(
    input.modalities,
    input.media_params,
  );
  return input.modalities
    .map((modality) => {
      const rows = SPEC_ROW_BUILDERS[modality](media_params);
      if (!rows.length) return null;
      return {
        modality,
        title: MODALITY_LABELS[modality] ?? modality,
        rows,
      };
    })
    .filter((section): section is ContentFormModalitySpecSection => section != null);
}

export function modalityLabel(id: MediaModalityId): string {
  return MODALITY_LABELS[id] ?? id;
}
