import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { CodeBlock } from "@/components/ai-elements/code-block";
import { cn } from "@/lib/utils";
import {
  getToolActivityState,
  getToolActivitySummary,
  getToolInputSummary,
  getToolLabel,
  getToolOutputMessage,
  TOOL_STATE_LABELS,
} from "@/lib/tool-display";

type ChatToolActivityProps = {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: unknown;
  toolError?: string;
  isStreaming?: boolean;
};

const stateStyles: Record<
  ReturnType<typeof getToolActivityState>,
  { dot: string; badge: string }
> = {
  pending: {
    dot: "bg-border",
    badge: "bg-secondary text-muted-foreground",
  },
  running: {
    dot: "bg-primary animate-pulse",
    badge: "bg-accent text-primary",
  },
  completed: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  error: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700",
  },
};

export function ChatToolActivity({
  toolName,
  toolInput,
  toolOutput,
  toolError,
  isStreaming,
}: ChatToolActivityProps) {
  const [expanded, setExpanded] = useState(false);
  const state = getToolActivityState({ toolError, isStreaming, toolOutput });
  const styles = stateStyles[state];
  const label = getToolLabel(toolName);
  const summary = getToolActivitySummary({
    toolName,
    toolInput,
    toolOutput,
    toolError,
  });
  const inputSummary = getToolInputSummary(toolName, toolInput);
  const outputMessage = getToolOutputMessage(toolOutput, toolError);
  const showDetails =
    Object.keys(toolInput).length > 0 ||
    (toolOutput !== undefined && typeof toolOutput !== "string");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-xl border border-border/90 bg-card/80 px-3 py-2.5 shadow-sm">
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden
            className={cn("mt-1.5 size-2 shrink-0 rounded-full", styles.dot)}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">{label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-medium",
                  styles.badge,
                )}
              >
                {TOOL_STATE_LABELS[state]}
              </span>
            </div>
            <p
              className={cn(
                "mt-1 text-sm leading-6",
                toolError ? "text-red-700" : "text-muted-foreground",
              )}
            >
              {summary}
            </p>
            {inputSummary &&
            outputMessage &&
            inputSummary !== outputMessage &&
            state === "completed" ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/70">
                {inputSummary}
              </p>
            ) : null}
          </div>
          {showDetails ? (
            <button
              type="button"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
              className="shrink-0 rounded-md p-1 text-muted-foreground/70 transition hover:bg-secondary hover:text-muted-foreground"
            >
              <ChevronDownIcon
                className={cn(
                  "size-4 transition-transform",
                  expanded && "rotate-180",
                )}
              />
              <span className="sr-only">{expanded ? "收起详情" : "展开详情"}</span>
            </button>
          ) : null}
        </div>

        {expanded && showDetails ? (
          <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
            {Object.keys(toolInput).length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  输入参数
                </p>
                <div className="rounded-lg bg-muted">
                  <CodeBlock
                    code={JSON.stringify(toolInput, null, 2)}
                    language="json"
                  />
                </div>
              </div>
            ) : null}
            {toolOutput !== undefined && typeof toolOutput !== "string" ? (
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
                  返回结果
                </p>
                <div className="rounded-lg bg-muted">
                  <CodeBlock
                    code={JSON.stringify(toolOutput, null, 2)}
                    language="json"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
