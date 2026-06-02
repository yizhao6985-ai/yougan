import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";

import { createStructuredModel } from "../../../llm/dashscope.js";
import { invokeStructuredOutput } from "../../../lib/structured-output.js";
import {
  briefSummary,
  profileSummary,
} from "../../../prompt/context.js";
import { resolveIndustryContext } from "../../../lib/industry-prompts.js";
import {
  newOutlineSection,
  type WorkOutline,
} from "../../../schema.js";
import {
  parseBrief,
  parseActiveTurnTask,
  parseOutline,
  parseProfile,
} from "../../../lib/parse-agent-state.js";
import { getState } from "../../../lib/tool-state.js";
import { toolCommand } from "../../../lib/tool-command.js";
import { OutlineResponseSchema } from "../../update-outline/schema.js";
import { resolveContentSpec } from "../../../lib/content-spec.js";

export const reviseOutline = tool(
  async ({ reason }, config) => {
    if (parseActiveTurnTask(getState()) !== "outline") {
      return toolCommand(config, "revise_outline 仅在大纲模式可用。");
    }
    const brief = parseBrief(getState());
    if (!brief.requirements.length) {
      return toolCommand(config, "尚无 brief 内容，请先在灵感模式补充需求。");
    }

    const profile = resolveContentSpec(parseProfile(getState()));
    const industry = resolveIndustryContext(profile);
    const existing = parseOutline(getState());
    const llm = createStructuredModel({ temperature: 0.5 });

    const prompt = `你是内容大纲策划，请根据新要求重新制定内容结构大纲。

调整原因：${reason.trim() || "用户新要求"}

${briefSummary(brief)}
${profileSummary(profile)}
行业：${industry}

输出 3–8 条内容结构条目，不要部门分工。`;

    try {
      const parsed = await invokeStructuredOutput(
        llm,
        OutlineResponseSchema,
        [new HumanMessage(prompt)],
        { name: "work_outline" },
      );
      const outline: WorkOutline = {
        ...existing,
        sections: parsed.sections.map((s) => newOutlineSection(s.description)),
        summary: parsed.summary,
      };
      return toolCommand(
        config,
        `已根据「${reason.trim() || "新要求"}」重新制定大纲。`,
        { outline },
      );
    } catch {
      return toolCommand(config, "大纲重新生成失败，请稍后重试。");
    }
  },
  {
    name: "revise_outline",
    description: "用户要求调整整体内容方向时，重新制定大纲。",
    schema: z.object({
      reason: z.string().describe("调整原因或用户新要求摘要"),
    }),
  },
);
