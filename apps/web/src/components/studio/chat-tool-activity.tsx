import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import { cn } from "@/lib/utils";
import {
  getToolActivityState,
  getToolDescription,
  getToolLabel,
  TOOL_STATE_LABELS,
} from "@/lib/tool-display";

type ChatToolActivityProps = {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: unknown;
  toolError?: string;
  isStreaming?: boolean;
};

const stateDotStyles: Record<
  ReturnType<typeof getToolActivityState>,
  string
> = {
  pending: "bg-border",
  running: "bg-primary animate-pulse",
  completed: "bg-primary/70",
  error: "bg-destructive",
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
  const label = getToolLabel(toolName);
  const description = getToolDescription({
    toolName,
    toolInput,
    toolOutput,
    toolError,
  });
  const canExpand = Boolean(description);

  return (
    <ChatStreamBlock>
      <div className={chatStreamBlock.header}>
        <span
          aria-hidden
          className={cn(chatStreamBlock.headerDot, stateDotStyles[state])}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={chatStreamBlock.headerTitle}>{label}</span>
            <span className={chatStreamBlock.headerMeta}>
              {TOOL_STATE_LABELS[state]}
            </span>
          </div>
          {description ? (
            <p
              className={cn(
                "mt-1 whitespace-pre-wrap wrap-break-word",
                chatStreamBlock.caption,
                toolError && "text-destructive",
                !expanded && "line-clamp-1",
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {canExpand ? (
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
            <span className="sr-only">{expanded ? "收起描述" : "展开描述"}</span>
          </button>
        ) : null}
      </div>
    </ChatStreamBlock>
  );
}
