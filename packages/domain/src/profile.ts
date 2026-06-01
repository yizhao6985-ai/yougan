/** 用户上传或抓取的参考素材条目 */
export interface ReferenceItem {
  source_type: "text" | "image" | "web";
  summary: string;
  keywords?: string[];
  tone_hints?: string[];
  structure_hints?: string[];
  hashtags?: string[];
  raw_excerpt?: string | null;
  image_url?: string | null;
  url?: string | null;
  title?: string | null;
}

/** 跨模式共用的作品创作特征，对应 Work.profile */
export interface WorkProfile {
  platform?: string | null;
  content_topic?: string | null;
  content_type?: string | null;
  content_format?: string | null;
  media_modality?: string | null;
  content_points?: string[];
  style?: string | null;
  tone?: string | null;
  persona?: string | null;
  audience?: string | null;
  goals?: string[];
  style_constraints?: string[];
  notes?: string | null;
  references?: ReferenceItem[];
}

export const EMPTY_WORK_PROFILE: WorkProfile = {
  platform: null,
  content_topic: null,
  content_type: null,
  content_format: null,
  media_modality: null,
  content_points: [],
  style: null,
  tone: null,
  persona: null,
  audience: null,
  goals: [],
  style_constraints: [],
  notes: null,
  references: [],
};
