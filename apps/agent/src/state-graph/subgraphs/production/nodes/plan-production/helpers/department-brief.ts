/** 制作部门职责说明（用于 planProduction 编排） */
import type { ProductionDepartment } from "@yougan/domain";

const DEPARTMENT_BRIEF: Record<ProductionDepartment, string> = {
  writing: "文案部：负责标题、正文、话题标签、口播稿等文字产出。",
  design:
    "设计部：负责封面、插画、海报与配图；executeDesign 编写文生图 prompt 与短说明，renderDesignImage 调用 image-01 出图，acceptTask 验收 prompt 方向与质量。",
  audio: "音频部：负责配音稿、播客脚本、音效与节奏建议。",
  video: "视频部：负责分镜脚本、口播、字幕与剪辑节奏建议。",
};

export function departmentsFromTasks(
  tasks: Array<{ department?: ProductionDepartment }>,
): ProductionDepartment[] {
  const seen = new Set<ProductionDepartment>();
  const result: ProductionDepartment[] = [];
  for (const task of tasks) {
    const dept = task.department ?? "writing";
    if (seen.has(dept)) continue;
    seen.add(dept);
    result.push(dept);
  }
  return result;
}

export function departmentsBrief(departments: ProductionDepartment[]): string {
  return departments.map((d) => DEPARTMENT_BRIEF[d]).join("\n");
}
