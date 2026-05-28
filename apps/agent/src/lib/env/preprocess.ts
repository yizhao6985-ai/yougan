/** 空字符串视为未设置，便于 optional 环境变量校验 */
export function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
