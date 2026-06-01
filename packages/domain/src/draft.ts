/** 创作模式产出成稿，对应 Work.draft */
export interface WorkDraft {
  platform: string;
  title?: string | null;
  body: string;
  hashtags?: string[];
  hook?: string | null;
  notes?: string | null;
  publish_ready?: boolean;
}
