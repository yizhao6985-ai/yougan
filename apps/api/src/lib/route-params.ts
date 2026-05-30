/** Express 路由参数在 strict 下为 string | string[]，统一收窄为 string。 */
export function routeParam(
  value: string | string[] | undefined,
  label = "param",
): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && typeof value[0] === "string" && value[0].length > 0) {
    return value[0];
  }
  throw new Error(`Invalid route ${label}`);
}
