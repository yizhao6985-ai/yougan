import {
  MODEL_TEMPERATURE_LEVELS,
  formatTemperature,
} from "@/lib/model-temperature";
import { STUDIO } from "@/lib/site-copy";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ModelTemperatureControl({
  level,
  onChange,
  disabled = false,
  className,
}: {
  level: number;
  onChange: (level: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label
          className={cn(
            "inline-flex min-w-[9.5rem] items-center gap-2 rounded-lg border border-border bg-muted/80 px-2.5 py-1.5",
            disabled && "cursor-not-allowed opacity-60",
            className,
          )}
        >
          <span className="shrink-0 text-xs text-muted-foreground">
            {STUDIO.modelTemperatureLabel}
            <span className="ml-1 text-[10px] font-normal text-muted-foreground/80">
              {STUDIO.modelTemperatureScope}
            </span>
          </span>
          <input
            type="range"
            min={1}
            max={MODEL_TEMPERATURE_LEVELS}
            step={1}
            value={level}
            disabled={disabled}
            onChange={(event) => onChange(Number(event.target.value))}
            className="h-1.5 w-full cursor-pointer accent-primary disabled:cursor-not-allowed"
            aria-label={`${STUDIO.modelTemperatureLabel}（${STUDIO.modelTemperatureScope}）`}
            aria-description={STUDIO.modelTemperatureHint}
            aria-valuemin={1}
            aria-valuemax={MODEL_TEMPERATURE_LEVELS}
            aria-valuenow={level}
            aria-valuetext={formatTemperature(level)}
          />
          <span className="w-7 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
            {formatTemperature(level)}
          </span>
        </label>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} collisionPadding={12}>
        {STUDIO.modelTemperatureHint}
      </TooltipContent>
    </Tooltip>
  );
}
