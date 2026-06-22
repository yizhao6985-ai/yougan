/** finalizeProduction 对话文案 */
import {
  previewPlainText,
  previewHasContent,
  type WorkPreview,
  type WorkProduction,
} from "@yougan/domain";

import { firstProductionFailureMessage } from "../../../helpers/task-plan.js";

const PREVIEW_EXCERPT_MAX = 1200;

function formatPreviewExcerpt(preview: WorkPreview): string {
  const plain = previewPlainText(preview, PREVIEW_EXCERPT_MAX);
  const title = preview.title?.trim();
  const titleBlock = title ? `**${title}**\n\n` : "";
  return `${titleBlock}${plain || "（以配图/音视频为主）"}\n\n---\n完整成稿已同步到右侧「作品」面板，可下载或发布。`;
}

/**
 * 判定优先级：成稿 preview > 任务失败 > 无计划 > 其他未完成。
 * preview 优先于 pending_tasks 为空，因 assemblePreview 成功后会清空任务队列。
 */
export function buildProductionFinalizeMessage(
  production: WorkProduction,
  preview: WorkPreview | null,
): string {
  if (preview != null && previewHasContent(preview)) {
    return formatPreviewExcerpt(preview);
  }

  const failureMessage = firstProductionFailureMessage(production);
  if (failureMessage) {
    return `本轮创作未能完成：${failureMessage}\n\n请查看右侧方案与计划后，可再次说明「开始创作」重试。`;
  }

  if (production.pending_tasks.length === 0) {
    return "未能生成制作计划，本轮创作未开始。请补充或完善作品方案后，再次说明创作意图重试。";
  }

  return "本轮创作已结束，可在右侧查看方案与作品状态。";
}
