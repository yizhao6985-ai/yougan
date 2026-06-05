import type { ProductionDepartment } from "#agent/schema.js"

export const DEPARTMENT_LABELS: Record<ProductionDepartment, string> = {
  writing: "文案专员",
  design: "设计师",
  audio: "音频专员",
  video: "视频专员",
};

export function profileReady(profile: {
  content_topic?: string | null;
}) {
  return Boolean(profile.content_topic?.trim());
}
