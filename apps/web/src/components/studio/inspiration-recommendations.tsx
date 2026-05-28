import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import type { InspirationRecommendation } from "@/lib/inspiration-recommendations";
import { cn } from "@/lib/utils";

export function InspirationRecommendations({
  recommendations,
  onSelect,
  disabled = false,
  className,
}: {
  recommendations: InspirationRecommendation[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Suggestions className={cn(className)}>
      {recommendations.map((recommendation) => (
        <Suggestion
          key={recommendation.id}
          suggestion={recommendation.suggestion}
          disabled={disabled}
          onClick={onSelect}
        />
      ))}
    </Suggestions>
  );
}
