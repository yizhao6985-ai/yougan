import type { TurnQueuePlannerKind } from "../../models/agent/turn.js";

/** 无 preview 时：用户明确要求开写/出稿 */
const START_PRODUCTION_PATTERNS: RegExp[] = [
  /开始(?:创作|制作|写|撰写|出稿|生成)/,
  /(?:现在|那就|请)(?:开始)?(?:写|制作|创作|出稿)/,
  /(?:可以|能)(?:开始)?写了/,
  /开写/,
  /出稿(?:吧|了)?/,
  /进入制作/,
  /(?:请|帮我)?写(?:一版|一下|吧)/,
  /生成(?:成稿|稿件|正文|内容|作品)/,
  /动手写/,
  /按(?:照)?方案(?:重新)?(?:生成|制作|创作|出稿|写)/,
  /(?:使?用|按)(?:当前|现有)?方案(?:重新)?(?:生成|制作|创作|出稿|写)/,
  /重新生成(?:作品|成稿)?/,
];

/** 有 preview 时：整稿重做（按方案重新出稿，非在成稿上局部改稿） */
const REWRITE_PRODUCTION_PATTERNS: RegExp[] = [
  /重(?:新)?写/,
  /另写(?:一)?(?:版|篇)/,
  /整稿重写/,
  /不要(?:这)?篇/,
  /换一(?:版|篇)/,
  /重新(?:开写|制作|创作|生成)/,
  /重新生成(?:作品|成稿|内容)?/,
  /按(?:照)?(?:当前|现有)?方案(?:重新)?(?:生成|制作|创作|出稿|写)/,
  /(?:使?用|按)(?:当前|现有)?方案(?:重新)?(?:生成|制作|创作|出稿|写)/,
  /(?:重新|再)(?:按方案)?(?:制作|出稿|生成)/,
];

/**
 * 用户是否**明确**表达开写或整稿重做意图。
 * 方案讨论、确认细节、「好的/继续/可以了」等不算。
 */
export function userExplicitProductionIntent(
  message: string,
  options: { hasPreview?: boolean } = {},
): boolean {
  const text = message.trim();
  if (!text) return false;

  const patterns = options.hasPreview
    ? [...REWRITE_PRODUCTION_PATTERNS, ...START_PRODUCTION_PATTERNS]
    : START_PRODUCTION_PATTERNS;

  return patterns.some((pattern) => pattern.test(text));
}

const REVISION_QUEUE_KINDS = ["collectRevision", "revise"] as const satisfies readonly TurnQueuePlannerKind[];

function hasExplicitProductionIntent(
  message: string,
  options: { hasPreview: boolean },
): boolean {
  return userExplicitProductionIntent(message, options);
}

/**
 * 从 planner 队列中移除误触的 production：
 * - 方案未就绪时不允许 production
 * - 用户未明确开写/重做时不允许 production
 *
 * 明确整稿重做/按方案重新出稿时：
 * - 移除 collectRevision / revise（与局部改稿互斥）
 * - 若模型未输出 production 则补入
 */
export function filterProductionUnlessExplicitIntent(
  queue: TurnQueuePlannerKind[],
  message: string,
  options: { hasPreview: boolean; profileReady: boolean },
): TurnQueuePlannerKind[] {
  const explicit = hasExplicitProductionIntent(message, {
    hasPreview: options.hasPreview,
  });

  let next = queue;

  if (explicit && options.profileReady) {
    next = next.filter(
      (kind) => !(REVISION_QUEUE_KINDS as readonly string[]).includes(kind),
    );
    if (!next.includes("production")) {
      next = [...next, "production"];
    }
  }

  if (!next.includes("production")) return next;

  if (!options.profileReady) {
    return next.filter((kind) => kind !== "production");
  }

  if (explicit) return next;

  return next.filter((kind) => kind !== "production");
}
