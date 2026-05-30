import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  ReferenceImageMedia,
  ReferenceMedia,
} from "@/components/reference/reference-media";
import { CreativeContextListItem } from "@/components/studio/creative-context/shared";
import { REFERENCE_PANEL } from "@/lib/site-copy";
import {
  referenceChipLabel,
  referenceDisplayText,
} from "@/lib/reference-display";
import type { ReferenceItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function referenceTypeLabel(sourceType: ReferenceItem["source_type"]) {
  return REFERENCE_PANEL.typeLabels[sourceType] ?? sourceType;
}

function referenceCardTitle(item: ReferenceItem, index: number) {
  if (item.title?.trim()) return item.title.trim();
  if (item.url) {
    try {
      return new URL(item.url).hostname.replace(/^www\./, "");
    } catch {
      return item.url;
    }
  }
  if (item.source_type === "image") return REFERENCE_PANEL.typeLabels.image;
  if (item.source_type === "text") return REFERENCE_PANEL.typeLabels.text;
  return REFERENCE_PANEL.fallbackTitle(index + 1);
}

function ReferenceMetaChips({ item }: { item: ReferenceItem }) {
  const chips = [
    ...(item.keywords ?? []),
    ...(item.tone_hints ?? []),
    ...(item.hashtags ?? []).map((tag) => tag.replace(/^#/, "")),
  ]
    .map(referenceChipLabel)
    .filter((chip): chip is string => Boolean(chip));

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {chips.slice(0, 6).map((chip) => (
        <span
          key={chip}
          className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] text-primary"
        >
          #{chip}
        </span>
      ))}
    </div>
  );
}

export function ReferenceCard({
  item,
  index,
}: {
  item: ReferenceItem;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const title = referenceCardTitle(item, index);
  const summary = referenceDisplayText(item.summary);
  const canExpand = Boolean(summary && summary.length > 120);
  const isImage = item.source_type === "image" && Boolean(item.image_url);
  const showInlineMedia =
    !isImage &&
    ((item.source_type === "text" && item.raw_excerpt?.trim()) ||
      (item.source_type === "web" && item.url));

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              className="rounded-md px-1.5 py-0 text-[10px] font-medium"
            >
              {referenceTypeLabel(item.source_type)}
            </Badge>
            <h4 className="min-w-0 truncate text-xs font-medium text-foreground">
              {title}
            </h4>
          </div>
        </div>
        {canExpand ? (
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex shrink-0 items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-expanded={expanded}
          >
            {expanded ? REFERENCE_PANEL.collapse : REFERENCE_PANEL.expand}
            <ChevronDownIcon
              className={cn(
                "size-3 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        ) : null}
      </div>

      {showInlineMedia ? <ReferenceMedia item={item} title={title} /> : null}

      {summary ? (
        <p
          className={cn(
            "text-xs leading-5 text-muted-foreground",
            !expanded && "line-clamp-2",
          )}
        >
          {summary}
        </p>
      ) : null}

      <ReferenceMetaChips item={item} />

      {item.url && item.source_type !== "web" ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[11px] text-primary hover:underline"
        >
          {REFERENCE_PANEL.openLink}
        </a>
      ) : null}
    </>
  );

  return (
    <CreativeContextListItem className="p-0">
      <div className="px-3 py-2.5">
        {isImage ? (
          <div className="flex gap-2.5">
            <ReferenceImageMedia item={item} title={title} />
            <div className="min-w-0 flex-1 space-y-1.5">{body}</div>
          </div>
        ) : (
          <div className="space-y-2">{body}</div>
        )}
      </div>
    </CreativeContextListItem>
  );
}
