/** 预览中的单张配图 */
export interface WorkPreviewImage {
  url: string;
  alt?: string | null;
  prompt?: string | null;
}

/**
 * 作品预览（制作子图交付物）。
 * 对应 Work.preview；产出后可生成 WorkVersion（phase=preview）。
 */
export interface WorkPreview {
  platform: string;
  title?: string | null;
  body: string;
  hashtags?: string[];
  hook?: string | null;
  /** 制作备注（内部说明，非正文） */
  notes?: string | null;
  images?: WorkPreviewImage[];
}
