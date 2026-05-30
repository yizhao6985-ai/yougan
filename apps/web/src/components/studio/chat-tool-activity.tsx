import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

import { CodeBlock } from "@/components/ai-elements/code-block";
import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
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
          <p
            className={cn(
              "mt-1",
              chatStreamBlock.muted,
              toolError && "text-destructive",
            )}
          >
            {summary}
          </p>
          {inputSummary &&
          outputMessage &&
          inputSummary !== outputMessage &&
          state === "completed" ? (
            <p className={cn("mt-1 line-clamp-2", chatStreamBlock.caption)}>
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
        <div className={cn(chatStreamBlock.divider, "space-y-3")}>
          {Object.keys(toolInput).length > 0 ? (
            <div className="space-y-1.5">
              <p className={chatStreamBlock.sectionLabel}>输入参数</p>
              <div className={chatStreamBlock.inset}>
                <CodeBlock
                  code={JSON.stringify(toolInput, null, 2)}
                  language="json"
                />
              </div>
            </div>
          ) : null}
          {toolOutput !== undefined && typeof toolOutput !== "string" ? (
            <div className="space-y-1.5">
              <p className={chatStreamBlock.sectionLabel}>返回结果</p>
              <div className={chatStreamBlock.inset}>
                <CodeBlock
                  code={JSON.stringify(toolOutput, null, 2)}
                  language="json"
                />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </ChatStreamBlock>
  );
}
