import {
  CONTENT_FORMATS,
  MEDIA_MODALITIES,
  buildDeliveryModalitySpecSections,
  getProfileSummary,
  referenceContentLabel,
  type ContentFormatId,
  type MediaModalityId,
  type WorkProfile,
  type WorkReference,
} from "@yougan/domain";

const FORMAT_LABELS = Object.fromEntries(
  CONTENT_FORMATS.map((item) => [item.id, item.label]),
) as Record<ContentFormatId, string>;

const MODALITY_LABELS = Object.fromEntries(
  MEDIA_MODALITIES.map((item) => [item.id, item.label]),
) as Record<MediaModalityId, string>;

function contentFormatLabel(id: string | null | undefined) {
  if (!id) return null;
  return FORMAT_LABELS[id as ContentFormatId] ?? id;
}

function modalityLabels(ids: MediaModalityId[]): string | null {
  if (!ids.length) return null;
  return ids.map((id) => MODALITY_LABELS[id] ?? id).join("、");
}

function deliveryStepSummary(profile: WorkProfile) {
  const delivery = profile.delivery;
  const format = delivery.format ? contentFormatLabel(delivery.format) : null;
  const modalities = modalityLabels(delivery.modalities);
  const parts = [
    format ? `形态：${format}（模板）` : null,
    modalities ? `内容媒介：${modalities}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定内容形态与规格";
}

const PROFILE_LIST_EMPTY = "（尚无）";

function formatProfileIdList<T extends { id: string; description: string }>(
  items: T[],
): string {
  return items.length
    ? items.map((item) => `- [${item.id}] ${item.description}`).join("\n")
    : PROFILE_LIST_EMPTY;
}

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

export function profileIntentSummary(profile: WorkProfile): string {
  const summary = profile.intent.summary.trim();
  return summary || "尚未确定创作定位";
}

export function profileDeliveryStepSummary(profile: WorkProfile): string {
  return deliveryStepSummary(profile);
}

export function profileExpressionSummary(profile: WorkProfile): string {
  const { expression } = profile;
  const parts = [
    expression.audience ? `受众：${expression.audience}` : null,
    expression.verbal?.trim() ? `文字风格：${expression.verbal.trim()}` : null,
    expression.visual?.trim() ? `画面方向：${expression.visual.trim()}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定表达设定";
}

export function profileSegmentsSummary(profile: WorkProfile): string {
  const segments = profile.structure.segments;
  if (!segments.length) {
    return `结构段（含 id，0 节）：\n${PROFILE_LIST_EMPTY}`;
  }
  const lines = segments.map((item) => {
    const role = item.role ? `[${item.role}] ` : "";
    const title = item.title?.trim() ? `${item.title.trim()}：` : "";
    return `- [${item.id}] ${role}${title}${item.description}`;
  });
  return `结构段（含 id，${segments.length} 节）：\n${lines.join("\n")}`;
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

export function profileSettingsSummary(profile: WorkProfile): string {
  const settings = profile.structure.settings;
  if (!settings.length) {
    return `创作设定（含 id，0 条）：\n${PROFILE_LIST_EMPTY}`;
  }
  return `创作设定（含 id，${settings.length} 条）：\n${settings.map(formatSettingLine).join("\n")}`;
}

export function profileConstraintsSummary(profile: WorkProfile): string {
  const rules = profile.constraints.rules;
  return `创作规则（含 id，${rules.length} 条）：\n${formatProfileIdList(rules)}`;
}

export function profileParamsSummary(profile: WorkProfile): string {
  const { modalities, media_params } = profile.delivery;
  const sections = buildDeliveryModalitySpecSections({
    modalities: modalities ?? [],
    media_params: media_params ?? {},
  });
  if (!sections.length) return "尚未设定媒介规格";

  return sections
    .map((section) => {
      const detail = section.rows.map((row) => `${row.label} ${row.value}`).join("，");
      return `${section.title}：${detail}`;
    })
    .join("；");
}

export function profileSummary(
  profile: WorkProfile,
  references?: WorkReference[],
): string {
  const summary = getProfileSummary(profile);
  const lines: string[] = ["制作方案（按步骤）"];
  lines.push(`① 创作定位：${profileIntentSummary(profile)}`);
  lines.push(`② 内容形态与规格：${profileDeliveryStepSummary(profile)}`);
  lines.push(`   规格：${profileParamsSummary(profile)}`);
  lines.push(`③ 表达设定：${profileExpressionSummary(profile)}`);
  if (profile.structure.settings.length || profile.structure.segments.length) {
    lines.push(
      `④ 结构与要素：设定 ${profile.structure.settings.length} 条；结构 ${profile.structure.segments.length} 节`,
    );
  }
  if (profile.constraints.rules.length) {
    lines.push(
      `⑤ 创作规则（${profile.constraints.rules.length} 条）：${profile.constraints.rules.map((g) => g.description).join("；")}`,
    );
  }
  if (references?.length) {
    lines.push(profileReferencesSummary(references));
  }
  if (
    !summary &&
    !profile.constraints.rules.length &&
    !profile.structure.settings.length &&
    !profile.structure.segments.length
  ) {
    return "尚无作品方案";
  }
  return lines.join("\n");
}
