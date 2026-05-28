import { z } from "zod";

import { emptyToUndefined } from "./preprocess.js";

export const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().optional(),
);

export const requiredString = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z.string().min(1),
);

/** 解析布尔环境变量；未设置时返回 defaultValue */
export function envBoolean(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === "") return defaultValue;
    if (typeof value !== "string") return value;
    const lower = value.trim().toLowerCase();
    if (lower === "false" || lower === "0" || lower === "no") return false;
    if (lower === "true" || lower === "1" || lower === "yes") return true;
    return defaultValue;
  }, z.boolean());
}
