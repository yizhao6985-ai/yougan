import {
  CONTENT_FORMATS,
  MEDIA_MODALITIES,
  getProfileSummary,
  normalizeProfileTextField,
  referenceContentLabel,
  inferModalitiesFromProfile,
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

const PROFILE_LIST_EMPTY = "（尚无）";

function contentFormatLabel(id: string | null | undefined) {
  if (!id) return null;
  return FORMAT_LABELS[id as ContentFormatId] ?? id;
}

function modalityLabels(ids: MediaModalityId[]): string | null {
  if (!ids.length) return null;
  return ids.map((id) => MODALITY_LABELS[id] ?? id).join("、");
}

function formatSpecList(items: Array<{ id: string; spec: string }>): string {
  return items.length
    ? items.map((item) => `- [${item.id}] ${item.spec}`).join("\n")
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

export function profileDirectionSummary(profile: WorkProfile): string {
  const { direction } = profile;
  const summary = normalizeProfileTextField(direction.summary);
  const audience = normalizeProfileTextField(direction.audience);
  const parts = [
    summary || "尚未确定创作定位",
    direction.format
      ? `形式：${contentFormatLabel(direction.format)}（模板）`
      : null,
    audience ? `受众：${audience}` : null,
  ].filter(Boolean);
  return parts.join("；");
}

export function profileStyleSummary(profile: WorkProfile): string {
  const style = profile.style ?? {};
  const verbal = normalizeProfileTextField(style.verbal);
  const visual = normalizeProfileTextField(style.visual);
  const parts = [
    verbal ? `文字风格：${verbal}` : null,
    visual ? `画面方向：${visual}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定风格";
}

export function profileSettingSummary(profile: WorkProfile): string {
  return `背景（含 id，${profile.setting.length} 条）：\n${formatSpecList(profile.setting)}`;
}

export function profileRequirementsSummary(profile: WorkProfile): string {
  const { requirements } = profile;
  if (!requirements.length) {
    return `需求（含 id，0 条）：\n${PROFILE_LIST_EMPTY}`;
  }
  const lines = requirements.map((item, index) => {
    return `- [${item.id}] ${index + 1}. ${item.spec}`;
  });
  return `需求（含 id，${requirements.length} 条）：\n${lines.join("\n")}`;
}

export function profileBoundsSummary(profile: WorkProfile): string {
  return `边界（含 id，${profile.bounds.length} 条）：\n${formatSpecList(profile.bounds)}`;
}

export function profileParamsSummary(profile: WorkProfile): string {
  const modalities = inferModalitiesFromProfile(profile);
  const labels = modalityLabels(modalities);
  return labels ? `推断媒介：${labels}` : "尚未推断媒介";
}

export function profileSummary(
  profile: WorkProfile,
  references?: WorkReference[],
): string {
  const summary = getProfileSummary(profile);
  const lines: string[] = ["制作方案"];

  lines.push(`① 方向：${profileDirectionSummary(profile)}`);
  lines.push(`② 风格：${profileStyleSummary(profile)}`);

  if (profile.setting.length) {
    lines.push(`③ 背景：${profile.setting.length} 条`);
  }
  if (profile.requirements.length) {
    lines.push(`④ 需求：${profile.requirements.length} 条`);
  }
  if (profile.bounds.length) {
    lines.push(
      `⑤ 边界：${profile.bounds.map((item) => item.spec).join("；")}`,
    );
  }

  if (references?.length) {
    lines.push(profileReferencesSummary(references));
  }

  if (
    !summary &&
    !profile.setting.length &&
    !profile.requirements.length &&
    !profile.bounds.length
  ) {
    return "尚无作品方案";
  }

  return lines.join("\n");
}

export function profileSummaryDetailed(
  profile: WorkProfile,
  references?: WorkReference[],
): string {
  const lines = [profileSummary(profile, references)];
  if (profile.setting.length) lines.push(profileSettingSummary(profile));
  if (profile.requirements.length) lines.push(profileRequirementsSummary(profile));
  if (profile.bounds.length) lines.push(profileBoundsSummary(profile));
  return lines.join("\n\n");
}
