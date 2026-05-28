/**
 * 灵感 → 大纲同步逻辑（DeepSeek structured output）。
 *
 * 两种场景：
 *   1. 无 creation.body：从灵感生成 pending_changes（待实现条目）
 *   2. 有 creation.body：对照灵感与现有作品，拆成 executed（已实现）+ pending（待实现）
 *
 * shouldAutoSyncOutline 控制 graph prepare 节点是否自动触发；
 * sync_outline_from_inspiration 工具供用户手动重新对照。
 */
import { HumanMessage } from "@langchain/core/messages";

import { createDeepSeekModel } from "../../llm/deepseek.js";
import { invokeStructuredOutput } from "../../lib/structured-output.js";
import {
  newOutlineChange,
  type ExecutedChange,
  type GeneratedContent,
  type WorkInspiration,
  type WorkOutline,
} from "../../schemas.js";
import { inspirationSummary, profileSummary } from "../../prompts/context.js";
import { OutlineSyncResultSchema } from "./schema.js";
import type { AgentStateType } from "./state.js";
import {
  parseInspiration,
  parseOutline,
  parseProfile,
} from "./state.js";

function dedupeDescriptions(items: { description: string }[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.description.trim().replace(/\s+/g, " ");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

function toExecutedChanges(descriptions: string[]): ExecutedChange[] {
  const executedAt = new Date().toISOString();
  return descriptions.map((description) => ({
    id: newOutlineChange(description).id,
    description,
    executed_at: executedAt,
    batch_summary: "灵感对照：已在当前作品中实现",
  }));
}

function mergeExecutedChanges(
  existing: ExecutedChange[],
  additions: ExecutedChange[],
): ExecutedChange[] {
  const seen = new Set(
    existing.map((item) => item.description.trim().replace(/\s+/g, " ")),
  );
  const merged = [...existing];
  for (const item of additions) {
    const key = item.description.trim().replace(/\s+/g, " ");
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
}

function buildOutlineFromSync(input: {
  outline: WorkOutline;
  implemented: string[];
  pending: string[];
  outlineSummary?: string;
}): WorkOutline {
  const implementedChanges = toExecutedChanges(input.implemented);
  return {
    ...input.outline,
    pending_changes: dedupeDescriptions(
      input.pending.map((description) => ({ description })),
    ).map((description) => newOutlineChange(description)),
    executed_changes: mergeExecutedChanges(
      input.outline.executed_changes,
      implementedChanges,
    ),
    outline_summary: input.outlineSummary ?? input.outline.outline_summary,
    outline_ready: false,
  };
}

function buildGapAnalysisPrompt(input: {
  inspiration: WorkInspiration;
  profile: ReturnType<typeof parseProfile>;
  creation: GeneratedContent;
  outline: WorkOutline;
}): string {
  return `你是大纲策划 Agent。请对照「灵感」与「当前作品产出」，判断哪些灵感已在作品中实现，哪些尚未实现。

规则：
1. implemented：已在当前作品（标题/正文）中体现的灵感要点
2. pending：灵感中尚未在当前作品中体现的要点，将作为本次创作大纲的待实现条目
3. 每条 description 应简洁、可执行，便于后续创作模式落地
4. outline_summary：一句话概括本次大纲目标（可选）

${inspirationSummary(input.inspiration)}

${profileSummary(input.profile)}

当前作品：
- 标题：${input.creation.title ?? "（无）"}
- 正文：${input.creation.body.slice(0, 4000)}

已有大纲已实现（${input.outline.executed_changes.length} 条）：
${
  input.outline.executed_changes.length
    ? input.outline.executed_changes.map((item) => `- ${item.description}`).join("\n")
    : "（无）"
}`;
}

function buildInspirationOutlinePrompt(input: {
  inspiration: WorkInspiration;
  profile: ReturnType<typeof parseProfile>;
}): string {
  return `你是大纲策划 Agent。当前尚无作品产出，请根据已确认灵感，生成创作大纲条目。

规则：
1. 全部条目放入 pending（implemented 留空）
2. 每条 pending 对应一个可独立执行的大纲要点
3. outline_summary：概括整份大纲方向（可选）

${inspirationSummary(input.inspiration)}

${profileSummary(input.profile)}`;
}

export async function syncOutlineFromInspiration(
  state: AgentStateType,
): Promise<WorkOutline> {
  const inspiration = parseInspiration(state);
  const outline = parseOutline(state);
  const profile = parseProfile(state);
  const creation = state.creation;

  if (!inspiration.confirmed_requirements.length) {
    return outline;
  }

  const llm = createDeepSeekModel({ temperature: 0.3 });
  const hasCreation = Boolean(creation?.body?.trim());

  const prompt = hasCreation
    ? buildGapAnalysisPrompt({
        inspiration,
        profile,
        creation: creation!,
        outline,
      })
    : buildInspirationOutlinePrompt({ inspiration, profile });

  const result = await invokeStructuredOutput(
    llm,
    OutlineSyncResultSchema,
    [
      new HumanMessage(
        hasCreation
          ? `请输出灵感与作品的对照结果。\n\n${prompt}`
          : `请根据灵感生成大纲条目。\n\n${prompt}`,
      ),
    ],
    { name: "outline_sync" },
  );

  return buildOutlineFromSync({
    outline,
    implemented: dedupeDescriptions(result.implemented),
    pending: dedupeDescriptions(result.pending),
    outlineSummary: result.outline_summary,
  });
}

/**
 * 是否在大纲子图 prepare 节点自动同步灵感→大纲。
 *
 * 触发条件（均要求有灵感且大纲未定稿）：
 *   - 大纲完全为空 → 首次从灵感生成
 *   - 已有作品但 pending 为空 → 重新对照已实现/待实现
 */
export function shouldAutoSyncOutline(state: AgentStateType): boolean {
  const inspiration = parseInspiration(state);
  const outline = parseOutline(state);
  const hasInspiration = inspiration.confirmed_requirements.length > 0;

  if (!hasInspiration) return false;
  if (outline.outline_ready) return false;

  const hasCreation = Boolean(state.creation?.body?.trim());
  const outlineEmpty =
    outline.pending_changes.length === 0 && outline.executed_changes.length === 0;

  if (outlineEmpty) return true;
  if (hasCreation && outline.pending_changes.length === 0) return true;
  return false;
}
