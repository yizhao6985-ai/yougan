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

export const EMPTY_WORK_REFERENCES: ReferenceItem[] = [];
