import { useState } from "react";
import { PencilIcon, Trash2Icon } from "lucide-react";

import {
  CreativeContextEmpty,
  CreativeContextList,
  CreativeContextListItem,
  CreativeContextSection,
  CreativeContextSubheading,
  formatContextTime,
} from "@/components/studio/creative-context/shared";
import { OUTLINE_PANEL } from "@/lib/site-copy";
import type { WorkOutline } from "@/lib/types";

function OutlineSectionItem({
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
                  aria-label="修改大纲条目"
                  onClick={() => setEditing(true)}
                >
                  <PencilIcon className="size-3.5" />
                </button>
                <button
                  type="button"
                  className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                  aria-label="删除大纲条目"
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

export function OutlinePanel({
  outline,
  editable = false,
  compact = false,
  onUpdateSection,
  onDeleteSection,
  onClearOutline,
}: {
  outline?: WorkOutline;
  editable?: boolean;
  compact?: boolean;
  onUpdateSection?: (sectionId: string, description: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onClearOutline?: () => void;
}) {
  const sections = outline?.sections ?? [];
  const hasContent = sections.length > 0 || Boolean(outline?.summary?.trim());

  return (
    <CreativeContextSection
      title={OUTLINE_PANEL.title}
      hint={OUTLINE_PANEL.hint}
      compact={compact}
      action={
        editable && sections.length > 0 ? (
          <button
            type="button"
            className="text-xs text-muted-foreground transition hover:text-red-600"
            onClick={onClearOutline}
          >
            {OUTLINE_PANEL.clearAll}
          </button>
        ) : undefined
      }
    >
      {outline?.summary?.trim() ? (
        <p className="text-sm leading-6 text-foreground">{outline.summary}</p>
      ) : null}

      {sections.length > 0 ? (
        <div className="space-y-2">
          <CreativeContextSubheading tone="primary">
            {OUTLINE_PANEL.sectionsLabel}
            {outline?.sections.length ? ` · ${outline.sections.length} 条` : ""}
          </CreativeContextSubheading>
          <CreativeContextList>
            {sections.map((item) => (
              <OutlineSectionItem
                key={item.id}
                description={item.description}
                confirmedAt={item.confirmed_at}
                editable={editable}
                onEdit={(next) => onUpdateSection?.(item.id, next)}
                onDelete={() => onDeleteSection?.(item.id)}
              />
            ))}
          </CreativeContextList>
        </div>
      ) : null}

      {!hasContent ? (
        <CreativeContextEmpty>{OUTLINE_PANEL.empty}</CreativeContextEmpty>
      ) : null}
    </CreativeContextSection>
  );
}
