import type { ReactNode } from "react";

import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export function HomeFeatureChapter({
  eyebrow,
  title,
  hint,
  children,
  className,
  id,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("relative", className)}>
      <header className="max-w-2xl">
        <p className={scene.pageEyebrow}>{eyebrow}</p>
        <h2 className={cn("mt-3", scene.sectionHeading)}>{title}</h2>
        {hint ? (
          <p className={cn("mt-3", scene.sectionHint)}>{hint}</p>
        ) : null}
      </header>
      <div className="mt-8 lg:mt-10">{children}</div>
    </section>
  );
}
