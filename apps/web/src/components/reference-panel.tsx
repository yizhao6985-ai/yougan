import {
  CreativeContextEmpty,
  CreativeContextList,
  CreativeContextListItem,
  CreativeContextSection,
} from "@/components/studio/creative-context/shared";
import { REFERENCE_PANEL } from "@/lib/site-copy";
import type { ReferenceItem } from "@/lib/types";

export function ReferencePanel({
  references,
}: {
  references?: ReferenceItem[];
}) {
  const items = references ?? [];

  return (
    <CreativeContextSection
      title={REFERENCE_PANEL.title}
      hint={REFERENCE_PANEL.hint}
    >
      {items.length === 0 ? (
        <CreativeContextEmpty>{REFERENCE_PANEL.empty}</CreativeContextEmpty>
      ) : (
        <CreativeContextList>
          {items.map((item, index) => (
            <CreativeContextListItem
              key={`${item.source_type}-${index}`}
              className="text-xs"
            >
              <div className="mb-1 font-medium capitalize text-foreground/90">
                {item.source_type}
              </div>
              <p className="text-muted-foreground">{item.summary}</p>
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-primary hover:text-primary"
                >
                  {item.title ?? item.url}
                </a>
              ) : null}
            </CreativeContextListItem>
          ))}
        </CreativeContextList>
      )}
    </CreativeContextSection>
  );
}
