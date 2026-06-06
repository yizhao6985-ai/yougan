import { z } from "zod";

export const MarkdownDeliverableSchema = z.object({
  body: z.string().min(1).describe("该任务的专业交付物（Markdown）"),
});

export type MarkdownDeliverable = z.infer<typeof MarkdownDeliverableSchema>;
