import { Link } from "react-router-dom";

import { scene } from "@/lib/scene-styles";
import { cn } from "@/lib/utils";

export type FeaturesAnchorLink = {
  href: string;
  label: string;
};

export function FeaturesAnchorNav({ links }: { links: readonly FeaturesAnchorLink[] }) {
  return (
    <nav
      aria-label="页面章节导航"
      className={cn(
        scene.surface,
        "sticky top-[4.25rem] z-30 -mx-1 flex gap-1.5 overflow-x-auto p-2 sm:top-16",
      )}
    >
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200",
            "text-muted-foreground hover:bg-accent hover:text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
        >
          {link.label}
        </a>
      ))}
      <Link
        to="/studio"
        className={cn(
          "ml-auto shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
          "transition-colors duration-200 hover:bg-primary/90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
      >
        开始创作
      </Link>
    </nav>
  );
}
