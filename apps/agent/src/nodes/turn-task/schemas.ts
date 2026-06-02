import { z } from "zod";

export const BriefTurnPatchSchema = z.object({
  add_requirements: z
    .array(z.string())
    .describe("用户本轮明确确认、应新增到 brief 的需求描述（每条一句，勿重复已有）"),
});

export const OutlineSectionPatchSchema = z.object({
  section_id: z.string().describe("现有大纲条目 id"),
  description: z.string().min(1).describe("更新后的条目描述"),
});

export const OutlineTurnPatchSchema = z.object({
  add_sections: z
    .array(z.string().min(1))
    .describe("新增的大纲条目描述"),
  update_sections: z
    .array(OutlineSectionPatchSchema)
    .describe("要修改的已有条目"),
  delete_section_ids: z
    .array(z.string())
    .describe("要删除的条目 id"),
  full_revise: z
    .boolean()
    .describe("是否因整体方向变化需要完全重做大纲"),
  revise_reason: z
    .string()
    .optional()
    .describe("full_revise 为 true 时的调整原因摘要"),
});
