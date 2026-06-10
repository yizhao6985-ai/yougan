import {
  CONTENT_FORMATS,
  getProfileSummary,
  mediaModalitiesLabel,
  referenceContentLabel,
  resolveDeliveryFromProfile,
  type ContentFormatId,
  type WorkProfile,
  type WorkReference,
} from "@yougan/domain";

const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((item) => [item.id, item.label]),
) as Record<ContentFormatId, string>;

function contentFormatLabel(id: string | null | undefined) {
  if (!id) return null;
  return FORMAT_LABELS[id as ContentFormatId] ?? id;
}

function deliverySummary(profile: WorkProfile) {
  const delivery = resolveDeliveryFromProfile(profile);
  const format = contentFormatLabel(delivery.format);
  const modalities = mediaModalitiesLabel(delivery.modalities);
  const parts = [
    delivery.topic ? `主题：${delivery.topic}` : null,
    delivery.intent ? `原话：${delivery.intent}` : null,
    format ? `体裁：${format}` : null,
    modalities ? `形式：${modalities}` : null,
    delivery.platform ? `平台：${delivery.platform}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定创作规格";
}

const PROFILE_LIST_EMPTY = "（尚无）";

function formatProfileIdList<T extends { id: string; description: string }>(
  items: T[],
): string {
  return items.length
    ? items.map((item) => `- [${item.id}] ${item.description}`).join("\n")
    : PROFILE_LIST_EMPTY;
}

/** 参考素材摘要（含分析要点与使用意图） */
export function profileReferencesSummary(
  references: WorkReference[] | undefined,
): string {
  const items = references ?? [];
  if (!items.length) return "尚无参考素材";

  const lines = items.map((item) => {
    const label = referenceContentLabel(item);
    const analysis = item.analysis.summary.trim();
    const intent = item.intent.summary.trim();
    const transcript = item.analysis.transcript?.trim();
    const visual = item.analysis.visual_cues?.trim();
    const extras = [
      transcript ? `转写：${transcript.slice(0, 120)}${transcript.length > 120 ? "…" : ""}` : null,
      visual ? `画面：${visual.slice(0, 120)}${visual.length > 120 ? "…" : ""}` : null,
    ].filter(Boolean);
    const extraBlock = extras.length ? `｜${extras.join("｜")}` : "";
    return `- [${item.id}] ${label}｜分析：${analysis}｜意图：${intent}${extraBlock}`;
  });

  return `参考素材（${items.length} 条）：\n${lines.join("\n")}`;
}

/** 交付规格正文（不含标题行） */
export function profileDeliverySummary(profile: WorkProfile): string {
  return deliverySummary(profile);
}

/** 表达设定正文（不含标题行） */
export function profileExpressionSummary(profile: WorkProfile): string {
  const { expression } = profile;
  const parts = [
    expression.audience ? `受众：${expression.audience}` : null,
    expression.verbal?.tone ? `语气：${expression.verbal.tone}` : null,
    expression.verbal?.style ? `文风：${expression.verbal.style}` : null,
    expression.verbal?.persona ? `叙述者：${expression.verbal.persona}` : null,
    expression.visual?.style ? `画风：${expression.visual.style}` : null,
    expression.visual?.mood ? `氛围：${expression.visual.mood}` : null,
    expression.visual?.palette ? `色彩：${expression.visual.palette}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定表达设定";
}

/** 结构段列表（含标题行与 id，供工具 update/delete 引用） */
export function profileSegmentsSummary(profile: WorkProfile): string {
  const segments = profile.blueprint.segments;
  return `结构段（含 id，${segments.length} 节）：\n${formatProfileIdList(segments)}`;
}

const SETTING_KIND_LABELS: Record<string, string> = {
  character: "对象",
  world: "背景",
  other: "其他",
};

function formatSettingLine(item: {
  id: string;
  kind: string;
  title?: string | null;
  description: string;
}): string {
  const kindLabel = SETTING_KIND_LABELS[item.kind] ?? item.kind;
  const name = item.title?.trim();
  const prefix = name ? `[${kindLabel} · ${name}]` : `[${kindLabel}]`;
  return `- [${item.id}] ${prefix} ${item.description}`;
}

/** 创作设定列表（含标题行与 id，供工具 update/delete 引用） */
export function profileSettingsSummary(profile: WorkProfile): string {
  const settings = profile.blueprint.settings;
  if (!settings.length) {
    return `创作设定（含 id，0 条）：\n${PROFILE_LIST_EMPTY}`;
  }
  return `创作设定（含 id，${settings.length} 条）：\n${settings.map(formatSettingLine).join("\n")}`;
}

/** 创作规则列表（含标题行与 id，供工具 update/delete 引用） */
export function profileGuardrailsSummary(profile: WorkProfile): string {
  const guardrails = profile.guardrails;
  return `创作规则（含 id，${guardrails.length} 条）：\n${formatProfileIdList(guardrails)}`;
}

/** 体裁参数正文（不含标题行） */
export function profileParamsSummary(profile: WorkProfile): string {
  const { params } = profile;
  const parts: string[] = [];

  if (params.kind === "text") {
    const { min, max } = params.word_count ?? {};
    if (min != null || max != null) {
      const words = [
        min != null ? `最少 ${min} 字` : null,
        max != null ? `最多 ${max} 字` : null,
      ].filter(Boolean);
      parts.push(`字数：${words.join("，")}`);
    }
    if (params.emoji_level) {
      const labels = { none: "不用", light: "少量", heavy: "较多" } as const;
      parts.push(`Emoji：${labels[params.emoji_level]}`);
    }
  }

  if (params.kind === "illustration") {
    if (params.aspect_ratio) parts.push(`画幅：${params.aspect_ratio}`);
    if (params.image_count != null) parts.push(`图片数：${params.image_count}`);
    if (params.negative_hints?.length) {
      parts.push(`负面提示：${params.negative_hints.join("、")}`);
    }
  }

  if (params.kind === "video") {
    if (params.duration_sec != null) parts.push(`时长：${params.duration_sec} 秒`);
    if (params.aspect_ratio) parts.push(`画幅：${params.aspect_ratio}`);
    if (params.pacing) parts.push(`节奏：${params.pacing}`);
  }

  if (params.kind === "audio") {
    if (params.duration_sec != null) parts.push(`时长：${params.duration_sec} 秒`);
    if (params.segment_count != null) parts.push(`段落数：${params.segment_count}`);
  }

  return parts.length ? parts.join("；") : "尚未设定体裁参数";
}

/** 作品方案紧凑总览（多场景通用） */
export function profileSummary(
  profile: WorkProfile,
  references?: WorkReference[],
): string {
  const summary = getProfileSummary(profile);
  const lines: string[] = ["创作规格"];
  if (summary) lines.push(`定位：${summary}`);
  lines.push(profileDeliverySummary(profile));
  lines.push(profileExpressionSummary(profile));
  if (references?.length) {
    lines.push(profileReferencesSummary(references));
  }
  if (profile.guardrails.length) {
    lines.push(
      `规则（${profile.guardrails.length} 条）：${profile.guardrails.map((g) => g.description).join("；")}`,
    );
  }
  if (profile.blueprint.settings.length) {
    lines.push(
      `设定（${profile.blueprint.settings.length} 条）：${profile.blueprint.settings.map((s) => formatSettingLine(s)).join("；")}`,
    );
  }
  if (profile.blueprint.segments.length) {
    lines.push(
      `结构（${profile.blueprint.segments.length} 节）：${profile.blueprint.segments.map((s, i) => `${i + 1}. ${s.description}`).join("；")}`,
    );
  }
  if (
    !summary &&
    !profile.guardrails.length &&
    !profile.blueprint.settings.length &&
    !profile.blueprint.segments.length &&
    !profile.delivery.topic
  ) {
    return "尚无作品方案";
  }
  return lines.join("\n");
}
