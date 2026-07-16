import {
  TURN_DIRECTION_PROMPT_MAX_LENGTH,
  TURN_DIRECTION_PROMPT_MIN_LENGTH,
} from "@yougan/domain";
import { z } from "zod";

export const TurnDirectionItemSchema = z.object({
  label: z
    .string()
    .min(2)
    .max(20)
    .describe(
      "chip 展示用：prompt 的口语化缩短（6–16 字），须能让人看出点了会说什么；禁止栏目名/清单/预警类抽象标签",
    ),
  prompt: z
    .string()
    .describe(
      `用户点击后原样发送的完整口语化中文（第一人称或直接祈使），${TURN_DIRECTION_PROMPT_MIN_LENGTH}–${TURN_DIRECTION_PROMPT_MAX_LENGTH} 字；禁止含英文双引号 "`,
    ),
  outcome: z
    .string()
    .min(8)
    .max(120)
    .describe("走此方向对作品/方案的预期效果，1–2 句"),
});

export function turnDirectionsResponseSchema(count: number) {
  return z.object({
    hint: z.string().optional(),
    directions: z
      .array(TurnDirectionItemSchema)
      .length(count)
      .describe(`恰好 ${count} 条延伸方向`),
  });
}
