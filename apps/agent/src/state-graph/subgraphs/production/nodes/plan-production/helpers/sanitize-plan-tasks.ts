import type { ProductionDepartment } from "@yougan/domain";

import type { PlanResponse } from "../schema.js";

const META_TASK_PATTERN =
  /大纲|提纲|outline|结构梳理|头脑风暴|调研|策划|规划(?!\s*分镜)|分镜设计/i;

type PlanTaskInput = PlanResponse["tasks"][number];

function isMetaTask(description: string): boolean {
  return META_TASK_PATTERN.test(description.trim());
}

const DEFAULT_WRITING_TASKS: PlanTaskInput[] = [
  {
    description: "撰写主体正文",
    department: "writing",
    direction: "完成作品主体内容，契合作品方案的主题、体裁、表达与结构。",
    acceptance_criteria:
      "主体正文完整响应该任务目标，契合作品方案；无明显跑题、空洞或违背创作规则。",
  },
  {
    description: "撰写标题与核心表达",
    department: "writing",
    direction: "提炼标题与核心表达，呼应主体内容与受众。",
    acceptance_criteria:
      "标题与核心表达清晰有力，与主体内容一致，符合体裁与平台习惯。",
  },
];

/** 过滤 meta 任务；若全部被滤掉则降级为节级默认任务。 */
export function sanitizePlanTasks(tasks: PlanTaskInput[]): PlanTaskInput[] {
  const filtered = tasks.filter((t) => !isMetaTask(t.description));
  if (filtered.length > 0) return filtered;
  return DEFAULT_WRITING_TASKS;
}

export type { PlanTaskInput };
