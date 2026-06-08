import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import {
  inferMediaKind,
  referenceAssetUrl,
  referenceContentLabel,
  type WorkReference,
} from "@yougan/domain";

import { Badge } from "@/components/ui/badge";
import {
  ReferenceAssetMedia,
  ReferenceMedia,
} from "@/components/reference/reference-media";
import { CreativeContextListItem } from "@/components/studio/creative-context/shared";
import { REFERENCE_PANEL } from "@/lib/site-copy";
import {
  referenceChipLabel,
  referenceDisplayText,
} from "@/lib/reference-display";
import { cn } from "@/lib/utils";

function referenceTypeLabel(reference: WorkReference) {
  const kind = referenceContentLabel(reference);
  return REFERENCE_PANEL.typeLabels[kind] ?? kind;
}

function referenceCardTitle(reference: WorkReference, index: number) {
  if (reference.content.kind === "asset") {
    const name = reference.content.asset.original_name?.trim();
    if (name) return name;
    const kind = inferMediaKind(reference.content.asset.mime_type);
    return REFERENCE_PANEL.typeLabels[kind] ?? REFERENCE_PANEL.typeLabels.file;
  }
  const excerpt = reference.content.text.trim();
  if (excerpt) return excerpt.slice(0, 40) + (excerpt.length > 40 ? "…" : "");
  return REFERENCE_PANEL.fallbackTitle(index + 1);
}

function ReferenceMetaChips({ reference }: { reference: WorkReference }) {
  const chips = [
    ...(reference.analysis.keywords ?? []),
    ...(reference.analysis.tone_hints ?? []),
    ...(reference.analysis.style_hints ?? []),
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
  item: WorkReference;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const title = referenceCardTitle(item, index);
  const analysis = referenceDisplayText(item.analysis.summary);
  const intent = referenceDisplayText(item.intent.summary);
  const canExpand = Boolean(
    (analysis && analysis.length > 120) || (intent && intent.length > 80),
  );
  const hasAssetThumb =
    item.content.kind === "asset" && Boolean(referenceAssetUrl(item));

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="secondary"
              className="rounded-md px-1.5 py-0 text-[10px] font-medium"
            >
              {referenceTypeLabel(item)}
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

      {!hasAssetThumb ? <ReferenceMedia item={item} title={title} /> : null}

      {analysis ? (
        <p
          className={cn(
            "text-xs leading-5 text-muted-foreground",
            !expanded && "line-clamp-2",
          )}
        >
          <span className="font-medium text-foreground/80">
            {REFERENCE_PANEL.analysisLabel}
          </span>
          {analysis}
        </p>
      ) : null}

      {intent ? (
        <p
          className={cn(
            "text-xs leading-5 text-muted-foreground",
            !expanded && "line-clamp-1",
          )}
        >
          <span className="font-medium text-foreground/80">
            {REFERENCE_PANEL.intentLabel}
          </span>
          {intent}
        </p>
      ) : null}

      <ReferenceMetaChips reference={item} />
    </>
  );

  return (
    <CreativeContextListItem className="p-0">
      <div className="px-3 py-2.5">
        {hasAssetThumb ? (
          <div className="flex gap-2.5">
            <ReferenceAssetMedia item={item} title={title} />
            <div className="min-w-0 flex-1 space-y-1.5">{body}</div>
          </div>
        ) : (
          <div className="space-y-2">{body}</div>
        )}
      </div>
    </CreativeContextListItem>
  );
}
