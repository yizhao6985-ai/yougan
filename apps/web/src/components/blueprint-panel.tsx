import { useState } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";

import {
  CreativeContextEmpty,
  CreativeContextInset,
  CreativeContextList,
  CreativeContextListItem,
  CreativeContextSection,
  CreativeContextSubheading,
  formatContextTime,
} from "@/components/studio/creative-context/shared";
import { BLUEPRINT_PANEL } from "@/lib/site-copy";
import {
  formatLabel,
  mediaTypeLabel,
} from "@/lib/discover-taxonomy";
import type { WorkBlueprint } from "@/lib/types";

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

function formatSpec(blueprint: WorkBlueprint) {
  const { spec, voice } = blueprint;
  const rows: Array<{ label: string; value: string }> = [];
  if (spec.content_topic) rows.push({ label: "主题", value: spec.content_topic });
  if (spec.content_type) rows.push({ label: "类型", value: spec.content_type });
  if (spec.content_format) {
    rows.push({
      label: "体裁",
      value: formatLabel(spec.content_format) ?? spec.content_format,
    });
  }
  if (spec.media_modality) {
    rows.push({
      label: "形式",
      value: mediaTypeLabel(spec.media_modality) ?? spec.media_modality,
    });
  }
  if (voice.audience) rows.push({ label: "受众", value: voice.audience });
  if (voice.tone) rows.push({ label: "语气", value: voice.tone });
  if (voice.style) rows.push({ label: "风格", value: voice.style });
  if (voice.persona) rows.push({ label: "人设", value: voice.persona });
  if (voice.goals?.length) {
    rows.push({ label: "目标", value: voice.goals.join("、") });
  }
  return rows;
}

export function BlueprintPanel({
  blueprint,
  editable = false,
  compact = false,
  onUpdateConstraint,
  onDeleteConstraint,
  onUpdateBeat,
  onDeleteBeat,
  onClearConstraints,
  onClearBeats,
}: {
  blueprint?: WorkBlueprint;
  editable?: boolean;
  compact?: boolean;
  onUpdateConstraint?: (id: string, description: string) => void;
  onDeleteConstraint?: (id: string) => void;
  onUpdateBeat?: (id: string, description: string) => void;
  onDeleteBeat?: (id: string) => void;
  onClearConstraints?: () => void;
  onClearBeats?: () => void;
}) {
  const data = blueprint ?? {
    spec: {},
    voice: {},
    premise: "",
    constraints: [],
    beats: [],
  };
  const specRows = formatSpec(data);
  const hasContent =
    specRows.length > 0 ||
    Boolean(data.premise.trim()) ||
    data.constraints.length > 0 ||
    data.beats.length > 0;

  return (
    <CreativeContextSection
      title={BLUEPRINT_PANEL.title}
      hint={BLUEPRINT_PANEL.hint}
      compact={compact}
    >
      {specRows.length > 0 ? (
        <CreativeContextInset>
          <dl className="grid gap-2 text-sm">
            {specRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[4.5rem_1fr] gap-2">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CreativeContextInset>
      ) : null}

      {data.premise.trim() ? (
        <div className="space-y-1">
          <CreativeContextSubheading tone="primary">
            {BLUEPRINT_PANEL.premiseLabel}
          </CreativeContextSubheading>
          <p className="text-sm leading-6 text-foreground">{data.premise}</p>
        </div>
      ) : null}

      {data.constraints.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <CreativeContextSubheading tone="primary">
              {BLUEPRINT_PANEL.constraintsLabel} · {data.constraints.length}
            </CreativeContextSubheading>
            {editable ? (
              <button
                type="button"
                className="text-xs text-muted-foreground transition hover:text-red-600"
                onClick={onClearConstraints}
              >
                {BLUEPRINT_PANEL.clearConstraints}
              </button>
            ) : null}
          </div>
          <CreativeContextList>
            {data.constraints.map((item) => (
              <EditableTextItem
                key={item.id}
                description={item.description}
                confirmedAt={item.confirmed_at}
                editable={editable}
                editLabel="修改写作要求"
                deleteLabel="删除写作要求"
                onEdit={(next) => onUpdateConstraint?.(item.id, next)}
                onDelete={() => onDeleteConstraint?.(item.id)}
              />
            ))}
          </CreativeContextList>
        </div>
      ) : null}

      {data.beats.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <CreativeContextSubheading tone="primary">
              {BLUEPRINT_PANEL.beatsLabel} · {data.beats.length}
            </CreativeContextSubheading>
            {editable ? (
              <button
                type="button"
                className="text-xs text-muted-foreground transition hover:text-red-600"
                onClick={onClearBeats}
              >
                {BLUEPRINT_PANEL.clearBeats}
              </button>
            ) : null}
          </div>
          <CreativeContextList>
            {data.beats.map((item, index) => (
              <EditableTextItem
                key={item.id}
                description={`${index + 1}. ${item.description}`}
                confirmedAt={item.confirmed_at}
                editable={editable}
                editLabel="修改内容节拍"
                deleteLabel="删除内容节拍"
                onEdit={(next) =>
                  onUpdateBeat?.(item.id, next.replace(/^\d+\.\s*/, ""))
                }
                onDelete={() => onDeleteBeat?.(item.id)}
              />
            ))}
          </CreativeContextList>
        </div>
      ) : null}

      {!hasContent ? (
        <CreativeContextEmpty>{BLUEPRINT_PANEL.empty}</CreativeContextEmpty>
      ) : null}
    </CreativeContextSection>
  );
}
