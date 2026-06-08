import { ReferenceCard } from "@/components/reference/reference-card";
import {
  CreativeContextEmpty,
  CreativeContextList,
  CreativeContextSection,
} from "@/components/studio/creative-context/shared";
import { REFERENCE_PANEL } from "@/lib/site-copy";
import type { WorkReference } from "@/lib/types";

export function ReferencePanel({
  references,
  compact = false,
}: {
  references?: WorkReference[];
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
              key={item.id}
              item={item}
              index={index}
            />
          ))}
        </CreativeContextList>
      )}
    </CreativeContextSection>
  );
}
