/** 预览中的单张配图 */
export interface WorkPreviewImage {
  url: string;
  alt?: string | null;
  prompt?: string | null;
  /** Agent 写入的外部临时链（如 MiniMax）；API sync 时物化后移除 */
  transient?: boolean;
}

/**
 * 作品预览（制作子图交付物）。
 * 嵌套于 Work.production.preview；产出后可生成 WorkVersion（kind=preview）。
 */
export interface WorkPreview {
  platform: string;
  title?: string | null;
  /** 成稿正文或短说明（插画体裁亦保留一段说明） */
  body: string;
  hashtags?: string[];
  hook?: string | null;
  /** 制作备注（内部说明，非正文） */
  notes?: string | null;
  images?: WorkPreviewImage[];
}
