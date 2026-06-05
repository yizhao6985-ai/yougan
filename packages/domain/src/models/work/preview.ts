export interface WorkPreviewImage {
  url: string;
  alt?: string | null;
  prompt?: string | null;
}

/** 制作模式产出的作品预览，对应 Work.preview */
export interface WorkPreview {
  platform: string;
  title?: string | null;
  body: string;
  hashtags?: string[];
  hook?: string | null;
  notes?: string | null;
  images?: WorkPreviewImage[];
  publish_ready?: boolean;
}
