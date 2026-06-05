import type { ProductionDepartment } from "@yougan/domain";

export const DEPARTMENT_LABELS: Record<ProductionDepartment, string> = {
  writing: "文案专员",
  design: "设计师",
  audio: "音频专员",
  video: "视频专员",
};
