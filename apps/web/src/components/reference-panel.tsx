import { ReferenceCard } from "@/components/reference/reference-card";
import {
  CreativeContextEmpty,
  CreativeContextList,
  CreativeContextSection,
} from "@/components/studio/creative-context/shared";
import { REFERENCE_PANEL } from "@/lib/site-copy";
import type { ReferenceItem } from "@/lib/types";

export function ReferencePanel({
  references,
  compact = false,
}: {
  references?: ReferenceItem[];
  compact?: boolean;
}) {
  const items = references ?? [];

  return (
    <CreativeContextSection
      title={REFERENCE_PANEL.title}
      hint={REFERENCE_PANEL.hint}
      compact={compact}
    >
      {items.length === 0 ? (
        <CreativeContextEmpty>{REFERENCE_PANEL.empty}</CreativeContextEmpty>
      ) : (
        <CreativeContextList>
          {items.map((item, index) => (
            <ReferenceCard
              key={`${item.source_type}-${item.image_url ?? item.url ?? item.summary}-${index}`}
              item={item}
              index={index}
            />
          ))}
        </CreativeContextList>
      )}
    </CreativeContextSection>
  );
}
