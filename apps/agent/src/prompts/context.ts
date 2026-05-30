/**
 * 把 profile / outline / inspiration 转成短文本，嵌入各 agent 的系统提示词。
 * 避免在 prompts.ts 里重复拼接字段逻辑。
 */
import type { WorkInspiration, WorkOutline, WorkProfile } from "../schemas.js";
import { contentSpecSummary as buildContentSpecSummary } from "../lib/content-spec.js";

export function contentSpecSummary(profile: WorkProfile): string {
  return buildContentSpecSummary(profile);
}

export function profileSummary(profile: WorkProfile): string {
  const parts: string[] = [];
  if (profile.platform) parts.push(`平台：${profile.platform}`);
  if (profile.content_topic) parts.push(`主题：${profile.content_topic}`);
  if (profile.content_type) parts.push(`类型：${profile.content_type}`);
  parts.push(contentSpecSummary(profile));
  if (profile.content_points?.length)
    parts.push(`要点：${profile.content_points.join(", ")}`);
  if (profile.style) parts.push(`风格：${profile.style}`);
  if (profile.tone) parts.push(`语气：${profile.tone}`);
  if (profile.persona) parts.push(`人设：${profile.persona}`);
  if (profile.audience) parts.push(`受众：${profile.audience}`);
  if (profile.goals?.length) parts.push(`目标：${profile.goals.join(", ")}`);
  if (profile.style_constraints?.length)
    parts.push(`约束：${profile.style_constraints.join(", ")}`);
  if (profile.notes) parts.push(`备注：${profile.notes}`);
  parts.push(`参考素材：${profile.references?.length ?? 0} 条`);
  return parts.length ? parts.join("；") : "尚无已执行特征";
}

export function outlineSummary(outline: WorkOutline): string {
  if (
    !outline.pending_changes.length &&
    !outline.executed_changes.length &&
    !outline.outline_summary
  ) {
    return "尚无创作大纲";
  }
  const lines: string[] = [];
  if (outline.outline_ready && outline.outline_summary) {
    lines.push(`大纲状态：已定稿`);
    lines.push(`大纲摘要：${outline.outline_summary}`);
  } else if (outline.pending_changes.length) {
    lines.push(`大纲状态：拟定中（${outline.pending_changes.length} 条）`);
  }
  if (outline.pending_changes.length) {
    lines.push(
      `大纲条目（${outline.pending_changes.length} 条）：${outline.pending_changes.map((c) => c.description).join("；")}`,
    );
  }
  if (outline.executed_changes.length) {
    const recent = outline.executed_changes.slice(-5);
    lines.push(
      `已执行变更（最近 ${recent.length} 条）：${recent.map((c) => c.description).join("；")}`,
    );
  }
  if (outline.last_execution_summary) {
    lines.push(`上次执行摘要：${outline.last_execution_summary}`);
  }
  return lines.join("\n");
}

export function inspirationSummary(inspiration: WorkInspiration): string {
  if (!inspiration.confirmed_requirements.length) return "尚无已确认需求";
  return `已确认需求（${inspiration.confirmed_requirements.length} 条）：${inspiration.confirmed_requirements.map((r) => r.description).join("；")}`;
}

export function profileContext(profile: WorkProfile): string {
  const parts: string[] = [];
  if (profile.platform) parts.push(`平台：${profile.platform}`);
  if (profile.content_topic) parts.push(`主题：${profile.content_topic}`);
  if (profile.content_type) parts.push(`类型：${profile.content_type}`);
  if (profile.audience) parts.push(`受众：${profile.audience}`);
  if (profile.style) parts.push(`风格：${profile.style}`);
  if (profile.tone) parts.push(`语气：${profile.tone}`);
  if (profile.goals?.length) parts.push(`目标：${profile.goals.join("、")}`);
  return parts.length ? parts.join("；") : "暂无";
}
