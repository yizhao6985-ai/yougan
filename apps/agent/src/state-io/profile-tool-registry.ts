/** 已注册方案工具名与 LLM 常见误用别名 */
export const PROFILE_TOOL_NAMES = [
  "update_profile_direction",
  "update_profile_style",
  "update_profile_setting",
  "update_profile_background",
  "update_profile_requirements",
  "update_profile_bounds",
] as const;

export type ProfileToolName = (typeof PROFILE_TOOL_NAMES)[number];

/** 误用工具名 → 已注册工具（执行前归一化，不扩充 bindTools 列表） */
const PROFILE_TOOL_ALIASES: Record<string, ProfileToolName> = {
  update_profile_summary: "update_profile_direction",
  update_profile_audience: "update_profile_direction",
  update_profile_format: "update_profile_direction",
  update_profile_plan: "update_profile_direction",
  update_profile_overview: "update_profile_direction",
  update_profile_verbal: "update_profile_style",
  update_profile_visual: "update_profile_style",
  update_profile_background_setting: "update_profile_setting",
  update_profile_context: "update_profile_setting",
  update_profile_requirement: "update_profile_requirements",
  update_profile_bound: "update_profile_bounds",
};

export function resolveProfileToolName(raw: string): ProfileToolName | null {
  const name = raw.trim();
  if (!name) return null;
  if ((PROFILE_TOOL_NAMES as readonly string[]).includes(name)) {
    return name as ProfileToolName;
  }
  return PROFILE_TOOL_ALIASES[name] ?? null;
}

export function isProfileToolActivityName(raw: string): boolean {
  return resolveProfileToolName(raw) != null;
}
