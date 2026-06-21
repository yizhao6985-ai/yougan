import type {
  Interrupt,
  Thread,
  ThreadState,
  ThreadTask,
} from "@langchain/langgraph-sdk";
import {
  REVISE_CONFIRM_INTERRUPT_KIND,
  type ReviseConfirmInterruptValue,
} from "@yougan/domain";

function isReviseConfirmPayload(
  value: unknown,
): value is ReviseConfirmInterruptValue {
  return (
    value != null &&
    typeof value === "object" &&
    "kind" in value &&
    value.kind === REVISE_CONFIRM_INTERRUPT_KIND
  );
}

function findReviseConfirmInInterruptList(
  interrupts: readonly Interrupt[],
): ReviseConfirmInterruptValue | null {
  for (const item of interrupts) {
    if (isReviseConfirmPayload(item.value)) return item.value;
  }
  return null;
}

function findReviseConfirmInTasks(
  tasks: readonly ThreadTask[],
): ReviseConfirmInterruptValue | null {
  for (const task of tasks) {
    const hit = findReviseConfirmInInterruptList(task.interrupts ?? []);
    if (hit) return hit;
    const nested = findReviseConfirmInTasks(task.state?.tasks ?? []);
    if (nested) return nested;
  }
  return null;
}

function asInterruptList(
  interrupt: Interrupt | Interrupt[] | undefined,
): Interrupt[] {
  if (interrupt == null) return [];
  return Array.isArray(interrupt) ? interrupt : [interrupt];
}

export function resolveReviseConfirmInterrupt(
  interrupt: Interrupt | Interrupt[] | undefined,
  persisted: ReviseConfirmInterruptValue | null | undefined,
): ReviseConfirmInterruptValue | null {
  for (const item of asInterruptList(interrupt)) {
    if (isReviseConfirmPayload(item.value)) return item.value;
  }
  return persisted ?? null;
}

export function hasReviseConfirmInterrupt(
  interrupt: Interrupt | Interrupt[] | undefined,
  persisted?: ReviseConfirmInterruptValue | null,
): boolean {
  return resolveReviseConfirmInterrupt(interrupt, persisted) != null;
}

export function isSameReviseConfirmInterrupt(
  a: ReviseConfirmInterruptValue | null | undefined,
  b: ReviseConfirmInterruptValue | null | undefined,
): boolean {
  if (a == null || b == null) return false;
  return (
    a.kind === b.kind && a.title === b.title && a.message === b.message
  );
}

export function getReviseConfirmInterruptFromThreadState(
  state: Pick<ThreadState, "tasks"> | null | undefined,
): ReviseConfirmInterruptValue | null {
  return findReviseConfirmInTasks(state?.tasks ?? []);
}

export function getReviseConfirmInterruptFromThread(
  thread: Pick<Thread, "interrupts" | "status"> | null | undefined,
): ReviseConfirmInterruptValue | null {
  if (!thread || thread.status !== "interrupted") return null;
  for (const items of Object.values(thread.interrupts ?? {})) {
    const hit = findReviseConfirmInInterruptList(items);
    if (hit) return hit;
  }
  return null;
}
