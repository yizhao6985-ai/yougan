import { tool } from "@langchain/core/tools";
import { z } from "zod";

import {
  appendBlueprintBeat as appendBeat,
  appendBlueprintConstraint as appendConstraint,
  clearBlueprintBeats as clearBeatsState,
  clearBlueprintConstraints as clearConstraintsState,
  deleteBlueprintBeat as removeBeat,
  deleteBlueprintConstraint as removeConstraint,
  findBlueprintBeatIndex,
  findBlueprintConstraintIndex,
  patchBlueprintSpec,
  patchBlueprintVoice,
  setBlueprintPremise,
  updateBlueprintBeat as patchBeat,
  updateBlueprintConstraint as patchConstraint,
} from "@yougan/domain";
import {
  parseActiveTurnKind,
  parseBlueprint,
} from "#agent/lib/parse-agent-state.js";
import { getState } from "#agent/lib/tool-state.js";
import { toolCommand } from "#agent/lib/tool-command.js";

function requireBlueprintMode(config: object): string | null {
  if (parseActiveTurnKind(getState()) !== "blueprint") {
    return "作品方案工具仅在 blueprint 模式可用。";
  }
  return null;
}

export const updateBlueprintSpec = tool(
  async (input, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);

    const updates = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );
    if (!Object.keys(updates).length) {
      return toolCommand(config, "未提供需要更新的创作规格。");
    }

    const blueprint = parseBlueprint(getState());
    return toolCommand(config, "已更新作品方案创作规格。", {
      blueprint: patchBlueprintSpec(blueprint, updates),
    });
  },
  {
    name: "update_blueprint_spec",
    description:
      "用户明确创作主题、体裁或媒介形式时写入 spec。仅当用户主动提到发布渠道时才写 platform。",
    schema: z.object({
      platform: z.string().nullable().optional(),
      content_topic: z.string().nullable().optional(),
      content_type: z.string().nullable().optional(),
      content_format: z.string().nullable().optional(),
      media_modality: z.string().nullable().optional(),
    }),
  },
);

export const updateBlueprintVoice = tool(
  async (input, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);

    const updates = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );
    if (!Object.keys(updates).length) {
      return toolCommand(config, "未提供需要更新的表达设定。");
    }

    const blueprint = parseBlueprint(getState());
    return toolCommand(config, "已更新作品方案表达设定。", {
      blueprint: patchBlueprintVoice(blueprint, updates),
    });
  },
  {
    name: "update_blueprint_voice",
    description: "写入受众、语气、风格等人设相关设定。",
    schema: z.object({
      audience: z.string().nullable().optional(),
      tone: z.string().nullable().optional(),
      style: z.string().nullable().optional(),
      persona: z.string().nullable().optional(),
      goals: z.array(z.string()).optional(),
    }),
  },
);

export const setBlueprintPremiseTool = tool(
  async ({ premise }, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);
    const trimmed = premise.trim();
    if (!trimmed) return toolCommand(config, "定位描述不能为空。");
    return toolCommand(config, "已更新作品方案定位。", {
      blueprint: setBlueprintPremise(parseBlueprint(getState()), trimmed),
    });
  },
  {
    name: "set_blueprint_premise",
    description: "写入或更新作品方案的一句话定位。",
    schema: z.object({
      premise: z.string().describe("这篇内容要讲什么"),
    }),
  },
);

export const addBlueprintConstraint = tool(
  async ({ description }, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "写作要求不能为空。");
    const blueprint = parseBlueprint(getState());
    const next = appendConstraint(blueprint, trimmed);
    if (!next) return toolCommand(config, "该要求已在方案中。");
    return toolCommand(
      config,
      `已添加写作要求（共 ${next.constraints.length} 条）。`,
      { blueprint: next },
    );
  },
  {
    name: "add_blueprint_constraint",
    description: "用户确认的非结构性写作要求（语气、禁忌、必提信息等）。",
    schema: z.object({
      description: z.string(),
    }),
  },
);

export const updateBlueprintConstraint = tool(
  async ({ constraint_id, description }, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "写作要求不能为空。");
    const blueprint = parseBlueprint(getState());
    if (findBlueprintConstraintIndex(blueprint, constraint_id) < 0) {
      return toolCommand(config, `未找到要求 ${constraint_id}。`);
    }
    return toolCommand(config, "已更新写作要求。", {
      blueprint: patchConstraint(blueprint, constraint_id, trimmed),
    });
  },
  {
    name: "update_blueprint_constraint",
    description: "修改已有写作要求。",
    schema: z.object({
      constraint_id: z.string(),
      description: z.string(),
    }),
  },
);

export const deleteBlueprintConstraint = tool(
  async ({ constraint_id }, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);
    const blueprint = parseBlueprint(getState());
    if (findBlueprintConstraintIndex(blueprint, constraint_id) < 0) {
      return toolCommand(config, `未找到要求 ${constraint_id}。`);
    }
    return toolCommand(config, "已删除写作要求。", {
      blueprint: removeConstraint(blueprint, constraint_id),
    });
  },
  {
    name: "delete_blueprint_constraint",
    description: "删除一条写作要求。",
    schema: z.object({ constraint_id: z.string() }),
  },
);

export const addBlueprintBeat = tool(
  async ({ description, intent }, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "节拍描述不能为空。");
    const blueprint = parseBlueprint(getState());
    const next = appendBeat(blueprint, trimmed, intent);
    if (!next) return toolCommand(config, "该节拍已在方案中。");
    return toolCommand(
      config,
      `已添加内容节拍（共 ${next.beats.length} 节）。`,
      { blueprint: next },
    );
  },
  {
    name: "add_blueprint_beat",
    description: "用户确认的一条有序内容结构节拍。",
    schema: z.object({
      description: z.string(),
      intent: z.string().nullable().optional(),
    }),
  },
);

export const updateBlueprintBeat = tool(
  async ({ beat_id, description, intent }, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);
    const trimmed = description.trim();
    if (!trimmed) return toolCommand(config, "节拍描述不能为空。");
    const blueprint = parseBlueprint(getState());
    if (findBlueprintBeatIndex(blueprint, beat_id) < 0) {
      return toolCommand(config, `未找到节拍 ${beat_id}。`);
    }
    return toolCommand(config, "已更新内容节拍。", {
      blueprint: patchBeat(blueprint, beat_id, trimmed, intent),
    });
  },
  {
    name: "update_blueprint_beat",
    description: "修改已有内容节拍。",
    schema: z.object({
      beat_id: z.string(),
      description: z.string(),
      intent: z.string().nullable().optional(),
    }),
  },
);

export const deleteBlueprintBeat = tool(
  async ({ beat_id }, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);
    const blueprint = parseBlueprint(getState());
    if (findBlueprintBeatIndex(blueprint, beat_id) < 0) {
      return toolCommand(config, `未找到节拍 ${beat_id}。`);
    }
    return toolCommand(config, "已删除内容节拍。", {
      blueprint: removeBeat(blueprint, beat_id),
    });
  },
  {
    name: "delete_blueprint_beat",
    description: "删除一个内容节拍。",
    schema: z.object({ beat_id: z.string() }),
  },
);

export const clearBlueprintConstraints = tool(
  async (_input, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);
    return toolCommand(config, "已清空写作要求。", {
      blueprint: clearConstraintsState(parseBlueprint(getState())),
    });
  },
  {
    name: "clear_blueprint_constraints",
    description: "清空全部写作要求。",
    schema: z.object({}),
  },
);

export const clearBlueprintBeats = tool(
  async (_input, config) => {
    const gate = requireBlueprintMode(config);
    if (gate) return toolCommand(config, gate);
    return toolCommand(config, "已清空内容节拍。", {
      blueprint: clearBeatsState(parseBlueprint(getState())),
    });
  },
  {
    name: "clear_blueprint_beats",
    description: "清空全部内容节拍。",
    schema: z.object({}),
  },
);
