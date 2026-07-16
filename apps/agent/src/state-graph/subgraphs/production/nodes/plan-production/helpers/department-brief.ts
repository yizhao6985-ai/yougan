/** 制作部门职责说明（用于 planProduction 编排） */
import type { ProductionDepartment } from "@yougan/domain";

const DEPARTMENT_BRIEF: Record<ProductionDepartment, string> = {
  writing: "文案部：负责标题、正文、话题标签、口播稿等文字产出。",
  video: "视频部：负责分镜脚本、口播、字幕与剪辑节奏建议（仅文本脚本）。",
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
