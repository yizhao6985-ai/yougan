/**
 * 灵感模式 Agent 结构化输出 schema（createReactAgent responseFormat）。
 */
import { z } from "zod";

export const InspirationTurnSchema = z
  .object({
    message: z
      .string()
      .min(1)
      .describe(
        "给用户看的对话正文：简洁中文，每次 1-2 个问题或一段总结；不要在正文里列举 A/B/C 或编号选项",
      ),
    show_choices: z
      .boolean()
      .describe(
        "是否展示可点击的单选选项。true：用户可用 2-6 个互斥选项直接回答；false：开放式追问、欢迎语、总结、引导切换大纲、告别等",
      ),
    choices: z
      .object({
        hint: z
          .string()
          .optional()
          .describe("选项区提示语，可选；缺省由前端使用默认文案"),
        options: z
          .array(
            z
              .object({
                description: z
                  .string()
                  .min(1)
                  .describe("用户点击后直接发送的完整句子"),
              })
              .describe("单个可点击选项"),
          )
          .min(2)
          .max(6)
          .describe("show_choices=true 时必填，2-6 个互斥选项"),
      })
      .optional()
      .describe("可点击选项；show_choices=false 时不要提供"),
  })
  .superRefine((value, ctx) => {
    if (value.show_choices) {
      const count = value.choices?.options?.length ?? 0;
      if (count < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "show_choices=true 时必须提供 2-6 个 options",
          path: ["choices"],
        });
      }
    }
  });

export type InspirationTurn = z.infer<typeof InspirationTurnSchema>;
