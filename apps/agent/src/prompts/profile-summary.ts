import {
  CONTENT_FORMATS,
  MEDIA_MODALITIES,
  getProfileSummary,
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
  const parts = [
    direction.summary.trim() || "尚未确定创作定位",
    direction.format
      ? `形式：${contentFormatLabel(direction.format)}（模板）`
      : null,
    direction.audience?.trim()
      ? `受众：${direction.audience.trim()}`
      : null,
  ].filter(Boolean);
  return parts.join("；");
}

export function profileStyleSummary(profile: WorkProfile): string {
  const style = profile.style ?? {};
  const parts = [
    style.verbal?.trim() ? `文字风格：${style.verbal.trim()}` : null,
    style.visual?.trim() ? `画面方向：${style.visual.trim()}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("；") : "尚未确定风格";
}

export function profileContextSummary(profile: WorkProfile): string {
  return `设定（含 id，${profile.context.length} 条）：\n${formatSpecList(profile.context)}`;
}

export function profileSequenceSummary(profile: WorkProfile): string {
  const { sequence } = profile;
  if (!sequence.length) {
    return `内容节拍（含 id，0 节）：\n${PROFILE_LIST_EMPTY}`;
  }
  const lines = sequence.map((item, index) => {
    const role = item.role ? `[${item.role}] ` : "";
    return `- [${item.id}] ${index + 1}. ${role}${item.spec}`;
  });
  return `内容节拍（含 id，${sequence.length} 节，软参考）：\n${lines.join("\n")}`;
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

  if (profile.context.length) {
    lines.push(`③ 设定：${profile.context.length} 条`);
  }
  if (profile.sequence.length) {
    lines.push(`④ 节拍：${profile.sequence.length} 节（软参考）`);
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
    !profile.context.length &&
    !profile.sequence.length &&
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
  if (profile.context.length) lines.push(profileContextSummary(profile));
  if (profile.sequence.length) lines.push(profileSequenceSummary(profile));
  if (profile.bounds.length) lines.push(profileBoundsSummary(profile));
  return lines.join("\n\n");
}
