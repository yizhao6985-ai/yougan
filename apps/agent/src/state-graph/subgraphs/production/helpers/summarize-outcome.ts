/** summarizeProduction 对话文案 */
import type { WorkPreview, WorkProduction } from "@yougan/domain";

import {
  firstProductionFailureMessage,
  productionPlanIsEmpty,
} from "./task-plan.js";

const PREVIEW_EXCERPT_MAX = 1200;

export function buildProductionSummaryMessage(
  production: WorkProduction,
  preview: WorkPreview | null,
): string {
  const failureMessage = firstProductionFailureMessage(production);

  if (productionPlanIsEmpty(production) && !failureMessage) {
    return "未能生成制作计划，本轮创作未开始。请补充或完善作品方案后，再次说明创作意图重试。";
  }

  if (failureMessage) {
    return `本轮创作未能完成：${failureMessage}\n\n请查看右侧方案与计划后，可再次说明「开始创作」重试。`;
  }

  const body = preview?.body?.trim() ?? "";
  if (body) {
    const title = preview?.title?.trim();
    const excerpt =
      body.length > PREVIEW_EXCERPT_MAX
        ? `${body.slice(0, PREVIEW_EXCERPT_MAX)}…`
        : body;
    const titleBlock = title ? `**${title}**\n\n` : "";
    return `${titleBlock}${excerpt}\n\n---\n完整成稿已同步到右侧「作品」面板，可复制或发布。`;
  }

  return "本轮创作已结束，可在右侧查看方案与作品状态。";
}
