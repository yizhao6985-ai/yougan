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
import { CONTENT_SETTINGS_PANEL } from "@/lib/site-copy";
import type { WorkInspiration, WorkProfile } from "@/lib/types";

const PROFILE_FIELDS: Array<{
  key: keyof WorkProfile;
  label: string;
  format?: (value: unknown) => string | null;
}> = [
  { key: "platform", label: "平台" },
  { key: "content_topic", label: "主题" },
  { key: "content_type", label: "类型" },
  {
    key: "content_points",
    label: "要点",
    format: (value) =>
      Array.isArray(value) && value.length ? value.join("、") : null,
  },
  { key: "style", label: "风格" },
  { key: "tone", label: "语气" },
  { key: "persona", label: "人设" },
  { key: "audience", label: "受众" },
  {
    key: "goals",
    label: "目标",
    format: (value) =>
      Array.isArray(value) && value.length ? value.join("、") : null,
  },
  {
    key: "style_constraints",
    label: "约束",
    format: (value) =>
      Array.isArray(value) && value.length ? value.join("、") : null,
  },
  { key: "notes", label: "备注" },
];

function formatField(
  profile: WorkProfile | undefined,
  field: (typeof PROFILE_FIELDS)[number],
) {
  const raw = profile?.[field.key];
  if (field.format) return field.format(raw);
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  return null;
}

function InspirationRequirementItem({
  description,
  confirmedAt,
  editable,
  onEdit,
  onDelete,
}: {
  description: string;
  confirmedAt: string;
  editable: boolean;
  onEdit: (next: string) => void;
  onDelete: () => void;
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
                  aria-label="修改灵感"
                  onClick={() => setEditing(true)}
                >
                  <PencilIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  aria-label="删除灵感"
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

export function ContentSettingsPanel({
  inspiration,
  profile,
  editable = false,
  onUpdateRequirement,
  onDeleteRequirement,
  onClearInspirations,
}: {
  inspiration?: WorkInspiration;
  profile?: WorkProfile;
  editable?: boolean;
  onUpdateRequirement?: (requirementId: string, description: string) => void;
  onDeleteRequirement?: (requirementId: string) => void;
  onClearInspirations?: () => void;
}) {
  const confirmed = inspiration?.confirmed_requirements ?? [];
  const profileFields = PROFILE_FIELDS.map((field) => ({
    ...field,
    value: formatField(profile, field),
  })).filter((field) => field.value);
  const hasContent = profileFields.length > 0 || confirmed.length > 0;

  return (
    <CreativeContextSection
      title={CONTENT_SETTINGS_PANEL.title}
      hint={CONTENT_SETTINGS_PANEL.hint}
      action={
        editable && confirmed.length > 0 ? (
          <button
            type="button"
            className="text-xs text-muted-foreground transition hover:text-red-600"
            onClick={onClearInspirations}
          >
            {CONTENT_SETTINGS_PANEL.clearAll}
          </button>
        ) : undefined
      }
    >
      {profileFields.length > 0 ? (
        <dl className="space-y-2">
          {profileFields.map((field) => (
            <CreativeContextInset key={field.key}>
              <dt className="text-xs font-medium text-muted-foreground">
                {field.label}
              </dt>
              <dd className="mt-0.5">{field.value}</dd>
            </CreativeContextInset>
          ))}
        </dl>
      ) : null}

      {confirmed.length > 0 ? (
        <div className="space-y-2">
          <CreativeContextSubheading tone="primary">
            {CONTENT_SETTINGS_PANEL.confirmedLabel}
          </CreativeContextSubheading>
          <CreativeContextList>
            {confirmed.map((item) => (
              <InspirationRequirementItem
                key={item.id}
                description={item.description}
                confirmedAt={item.confirmed_at}
                editable={editable}
                onEdit={(next) => onUpdateRequirement?.(item.id, next)}
                onDelete={() => onDeleteRequirement?.(item.id)}
              />
            ))}
          </CreativeContextList>
        </div>
      ) : null}

      {!hasContent ? (
        <CreativeContextEmpty>{CONTENT_SETTINGS_PANEL.empty}</CreativeContextEmpty>
      ) : null}
    </CreativeContextSection>
  );
}
