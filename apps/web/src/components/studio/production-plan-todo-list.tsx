import { CheckIcon, CircleIcon, Loader2Icon } from "lucide-react";

import {
  ChatStreamBlock,
  chatStreamBlock,
} from "@/components/studio/chat-stream-block";
import { PRODUCTION_PLAN_TODO } from "@/lib/site-copy";
import type { WorkProductionPlan } from "@/lib/types";
import { getPlanSummary, isPlanReady } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEPT_LABELS: Record<string, string> = {
  writing: "文案",
  design: "设计",
  audio: "音频",
  video: "视频",
};

export function hasProductionPlanActivity(plan?: WorkProductionPlan): boolean {
  if (!plan) return false;
  return (
    (plan.pending_changes?.length ?? 0) > 0 ||
    (plan.executed_changes?.length ?? 0) > 0 ||
    Boolean(getPlanSummary(plan)) ||
    isPlanReady(plan) ||
    Boolean(plan.creative_director_notes?.trim())
  );
}

type TodoRow = {
  id: string;
  description: string;
  department?: string;
  done: boolean;
  inProgress: boolean;
};

function buildTodoRows(plan: WorkProductionPlan): TodoRow[] {
  const done: TodoRow[] = (plan.executed_changes ?? []).map((change) => ({
    id: change.id,
    description: change.description,
    department: change.department,
    done: true,
    inProgress: false,
  }));

  const open: TodoRow[] = (plan.pending_changes ?? []).map((task) => ({
    id: task.id,
    description: task.description,
    department: task.department,
    done: false,
    inProgress: task.status === "in_progress",
  }));

  return [...open, ...done];
}

export function ProductionPlanTodoList({
  plan,
  className,
}: {
  plan?: WorkProductionPlan;
  className?: string;
}) {
  if (!plan || !hasProductionPlanActivity(plan)) return null;

  const summary = getPlanSummary(plan);
  const ready = isPlanReady(plan);
  const rows = buildTodoRows(plan);
  const pendingCount = plan.pending_changes?.length ?? 0;
  const doneCount = plan.executed_changes?.length ?? 0;

  return (
    <ChatStreamBlock className={className}>
      <div className={chatStreamBlock.header}>
        <span
          className={cn(chatStreamBlock.headerDot, "bg-primary/80")}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className={chatStreamBlock.headerTitle}>
            {PRODUCTION_PLAN_TODO.title}
          </p>
          <p className={cn(chatStreamBlock.caption, "mt-0.5")}>
            {ready
              ? PRODUCTION_PLAN_TODO.subtitleReady(pendingCount, doneCount)
              : PRODUCTION_PLAN_TODO.subtitlePlanning}
          </p>
        </div>
      </div>

      {ready && summary ? (
        <p className={cn(chatStreamBlock.inset, "text-foreground/90")}>
          {summary}
        </p>
      ) : null}

      {outline.creative_director_notes?.trim() ? (
        <p className={chatStreamBlock.muted}>{outline.creative_director_notes}</p>
      ) : null}

      {rows.length > 0 ? (
        <ul className="space-y-1.5" role="list">
          {rows.map((row) => (
            <li
              key={row.id}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border border-border/60 px-3 py-2",
                row.done
                  ? "bg-muted/20 text-muted-foreground"
                  : row.inProgress
                    ? "border-primary/25 bg-accent/40"
                    : "bg-muted/30",
              )}
            >
              <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
                {row.done ? (
                  <CheckIcon className="size-4 text-primary" />
                ) : row.inProgress ? (
                  <Loader2Icon className="size-4 animate-spin text-primary" />
                ) : (
                  <CircleIcon className="size-4" />
                )}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 text-sm leading-6",
                  row.done && "line-through decoration-muted-foreground/50",
                )}
              >
                {row.department ? (
                  <span className="mr-1.5 text-xs text-muted-foreground">
                    [{DEPT_LABELS[row.department] ?? row.department}]
                  </span>
                ) : null}
                {row.description}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={chatStreamBlock.muted}>{PRODUCTION_PLAN_TODO.empty}</p>
      )}
    </ChatStreamBlock>
  );
}
