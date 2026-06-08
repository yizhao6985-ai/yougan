import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRightIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  CreativeContextEmpty,
  CreativeContextInset,
  CreativeContextList,
  CreativeContextListItem,
  CreativeContextSection,
  formatContextTime,
} from "@/components/studio/creative-context/shared";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { PROFILE_PANEL } from "@/lib/site-copy";
import {
  formatLabel,
  mediaTypeLabel,
  topicCategoryLabel,
} from "@/lib/discover-taxonomy";
import type { WorkProfile } from "@/lib/types";

function EditableTextItem({
  description,
  confirmedAt,
  editable,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: {
  description: string;
  confirmedAt: string;
  editable: boolean;
  onEdit: (next: string) => void;
  onDelete: () => void;
  editLabel: string;
  deleteLabel: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);

  const save = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === description.trim()) {
      setDraft(description);
      setEditing(false);
      return;
    }
    onEdit(trimmed);
    setEditing(false);
  };

  return (
    <CreativeContextListItem>
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="min-h-16 w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-2 py-1 text-xs text-primary-foreground"
              onClick={save}
            >
              保存
            </button>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs text-muted-foreground"
              onClick={() => {
                setDraft(description);
                setEditing(false);
              }}
            >
              取消
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-pretty leading-6">{description}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground/70">
              {formatContextTime(confirmedAt)}
            </p>
            {editable ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={editLabel}
                  onClick={() => setEditing(true)}
                >
                  <PencilIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  aria-label={deleteLabel}
                  onClick={onDelete}
                >
                  <Trash2Icon className="size-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </>
      )}
    </CreativeContextListItem>
  );
}

function ProfileSubsection({
  title,
  count,
  action,
  hasContent,
  empty,
  children,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
  hasContent: boolean;
  empty: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(hasContent);
  const hadContentRef = useRef(hasContent);
  const heading = count != null ? `${title} · ${count}` : title;

  useEffect(() => {
    if (hasContent && !hadContentRef.current) {
      setOpen(true);
    }
    hadContentRef.current = hasContent;
  }, [hasContent]);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <div className="flex items-center justify-between gap-2">
        <CollapsibleTrigger
          className={cn(
            "flex min-w-0 flex-1 items-center gap-1.5 rounded-md py-0.5 text-left",
            "transition-colors hover:bg-muted/50",
          )}
          aria-label={open ? `收起${title}` : `展开${title}`}
        >
          <ChevronRightIcon
            className={cn(
              "size-3.5 shrink-0 text-muted-foreground/70 transition-transform duration-200",
              "group-data-[state=open]/collapsible:rotate-90",
            )}
          />
          <span className="text-xs font-medium uppercase tracking-wide text-primary">
            {heading}
          </span>
        </CollapsibleTrigger>
        {open ? action : null}
      </div>
      <CollapsibleContent className="pt-2">
        {hasContent ? children : <CreativeContextEmpty>{empty}</CreativeContextEmpty>}
      </CollapsibleContent>
    </Collapsible>
  );
}

function SpecRows({ rows }: { rows: Array<{ label: string; value: string }> }) {
  if (!rows.length) return null;
  return (
    <CreativeContextInset>
      <dl className="grid gap-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[4.5rem_1fr] gap-2">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </CreativeContextInset>
  );
}

function formatDeliveryRows(profile: WorkProfile) {
  const { delivery } = profile;
  const rows: Array<{ label: string; value: string }> = [];
  if (delivery.topic) rows.push({ label: "主题", value: delivery.topic });
  if (delivery.format) {
    rows.push({
      label: "体裁",
      value: formatLabel(delivery.format) ?? delivery.format,
    });
  }
  if (delivery.modalities?.length) {
    rows.push({
      label: "形式",
      value:
        mediaTypeLabel(delivery.modalities) ?? delivery.modalities.join(", "),
    });
  }
  if (delivery.platform) rows.push({ label: "平台", value: delivery.platform });
  if (delivery.category) {
    rows.push({
      label: "分类",
      value: topicCategoryLabel(delivery.category) ?? delivery.category,
    });
  }
  if (delivery.intent) rows.push({ label: "原话", value: delivery.intent });
  return rows;
}

function formatExpressionRows(profile: WorkProfile) {
  const { expression } = profile;
  const rows: Array<{ label: string; value: string }> = [];
  if (expression.audience) rows.push({ label: "受众", value: expression.audience });
  if (expression.verbal?.tone) rows.push({ label: "语气", value: expression.verbal.tone });
  if (expression.verbal?.style) rows.push({ label: "文风", value: expression.verbal.style });
  if (expression.verbal?.persona) {
    rows.push({ label: "叙述者", value: expression.verbal.persona });
  }
  if (expression.visual?.style) rows.push({ label: "画风", value: expression.visual.style });
  if (expression.visual?.mood) rows.push({ label: "氛围", value: expression.visual.mood });
  if (expression.visual?.palette) rows.push({ label: "色彩", value: expression.visual.palette });
  return rows;
}

function formatParamsRows(profile: WorkProfile) {
  const { params } = profile;
  const rows: Array<{ label: string; value: string }> = [];

  if (params.kind === "text") {
    const { min, max } = params.word_count ?? {};
    if (min != null || max != null) {
      const parts = [
        min != null ? `最少 ${min} 字` : null,
        max != null ? `最多 ${max} 字` : null,
      ].filter(Boolean);
      rows.push({ label: "字数", value: parts.join("，") });
    }
    if (params.emoji_level) {
      const labels = { none: "不用", light: "少量", heavy: "较多" } as const;
      rows.push({ label: "Emoji", value: labels[params.emoji_level] });
    }
  }

  if (params.kind === "illustration") {
    if (params.aspect_ratio) rows.push({ label: "画幅", value: params.aspect_ratio });
    if (params.image_count != null) {
      rows.push({ label: "图片数", value: String(params.image_count) });
    }
    if (params.negative_hints?.length) {
      rows.push({ label: "负面提示", value: params.negative_hints.join("、") });
    }
  }

  if (params.kind === "video") {
    if (params.duration_sec != null) {
      rows.push({ label: "时长", value: `${params.duration_sec} 秒` });
    }
    if (params.aspect_ratio) rows.push({ label: "画幅", value: params.aspect_ratio });
    if (params.pacing) rows.push({ label: "节奏", value: params.pacing });
  }

  if (params.kind === "audio") {
    if (params.duration_sec != null) {
      rows.push({ label: "时长", value: `${params.duration_sec} 秒` });
    }
    if (params.segment_count != null) {
      rows.push({ label: "段落数", value: String(params.segment_count) });
    }
  }

  return rows;
}

const EMPTY_PROFILE: WorkProfile = {
  delivery: { topic: "", format: "short_post", modalities: ["text"] },
  expression: {},
  blueprint: { summary: "", segments: [] },
  guardrails: [],
  params: { kind: "text" },
};

export function ProfilePanel({
  profile,
  editable = false,
  compact = false,
  onUpdateGuardrail,
  onDeleteGuardrail,
  onUpdateSegment,
  onDeleteSegment,
  onClearGuardrails,
  onClearSegments,
}: {
  profile?: WorkProfile;
  editable?: boolean;
  compact?: boolean;
  onUpdateGuardrail?: (id: string, description: string) => void;
  onDeleteGuardrail?: (id: string) => void;
  onUpdateSegment?: (id: string, description: string) => void;
  onDeleteSegment?: (id: string) => void;
  onClearGuardrails?: () => void;
  onClearSegments?: () => void;
}) {
  const data = profile ?? EMPTY_PROFILE;
  const deliveryRows = formatDeliveryRows(data);
  const expressionRows = formatExpressionRows(data);
  const paramsRows = formatParamsRows(data);
  const summary = data.blueprint.summary.trim();
  const segments = data.blueprint.segments;
  const guardrails = data.guardrails;

  return (
    <CreativeContextSection
      title={PROFILE_PANEL.title}
      hint={PROFILE_PANEL.hint}
      compact={compact}
    >
      <div className="space-y-4">
        <ProfileSubsection
          title={PROFILE_PANEL.deliveryLabel}
          hasContent={deliveryRows.length > 0}
          empty={PROFILE_PANEL.deliveryEmpty}
        >
          <SpecRows rows={deliveryRows} />
        </ProfileSubsection>

        <ProfileSubsection
          title={PROFILE_PANEL.expressionLabel}
          hasContent={expressionRows.length > 0}
          empty={PROFILE_PANEL.expressionEmpty}
        >
          <SpecRows rows={expressionRows} />
        </ProfileSubsection>

        <ProfileSubsection
          title={PROFILE_PANEL.summaryLabel}
          hasContent={Boolean(summary)}
          empty={PROFILE_PANEL.summaryEmpty}
        >
          <CreativeContextInset>
            <p className="text-pretty leading-6">{summary}</p>
          </CreativeContextInset>
        </ProfileSubsection>

        <ProfileSubsection
          title={PROFILE_PANEL.segmentsLabel}
          count={segments.length > 0 ? segments.length : undefined}
          hasContent={segments.length > 0}
          empty={PROFILE_PANEL.segmentsEmpty}
          action={
            editable && segments.length > 0 ? (
              <button
                type="button"
                className="text-xs text-muted-foreground transition hover:text-red-600"
                onClick={onClearSegments}
              >
                {PROFILE_PANEL.clearSegments}
              </button>
            ) : null
          }
        >
          <CreativeContextList>
            {segments.map((item, index) => (
              <EditableTextItem
                key={item.id}
                description={`${index + 1}. ${item.description}`}
                confirmedAt={item.confirmed_at}
                editable={editable}
                editLabel="修改结构段"
                deleteLabel="删除结构段"
                onEdit={(next) =>
                  onUpdateSegment?.(item.id, next.replace(/^\d+\.\s*/, ""))
                }
                onDelete={() => onDeleteSegment?.(item.id)}
              />
            ))}
          </CreativeContextList>
        </ProfileSubsection>

        <ProfileSubsection
          title={PROFILE_PANEL.guardrailsLabel}
          count={guardrails.length > 0 ? guardrails.length : undefined}
          hasContent={guardrails.length > 0}
          empty={PROFILE_PANEL.guardrailsEmpty}
          action={
            editable && guardrails.length > 0 ? (
              <button
                type="button"
                className="text-xs text-muted-foreground transition hover:text-red-600"
                onClick={onClearGuardrails}
              >
                {PROFILE_PANEL.clearGuardrails}
              </button>
            ) : null
          }
        >
          <CreativeContextList>
            {guardrails.map((item) => (
              <EditableTextItem
                key={item.id}
                description={item.description}
                confirmedAt={item.confirmed_at}
                editable={editable}
                editLabel="修改创作规则"
                deleteLabel="删除创作规则"
                onEdit={(next) => onUpdateGuardrail?.(item.id, next)}
                onDelete={() => onDeleteGuardrail?.(item.id)}
              />
            ))}
          </CreativeContextList>
        </ProfileSubsection>

        <ProfileSubsection
          title={PROFILE_PANEL.paramsLabel}
          hasContent={paramsRows.length > 0}
          empty={PROFILE_PANEL.paramsEmpty}
        >
          <SpecRows rows={paramsRows} />
        </ProfileSubsection>
      </div>
    </CreativeContextSection>
  );
}
