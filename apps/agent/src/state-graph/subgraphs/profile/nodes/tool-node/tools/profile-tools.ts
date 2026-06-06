/** 作品方案增量工具：spec / voice / premise / constraints / beats */
import { ToolMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { z } from "zod";

import {
  appendProfileBeat,
  appendProfileBeats,
  appendProfileConstraint,
  clearProfileBeats,
  clearProfileConstraints,
  deleteProfileBeat,
  deleteProfileConstraint,
  findProfileBeatIndex,
  findProfileConstraintIndex,
  patchProfileSpec,
  patchProfileVoice,
  setProfilePremise,
  updateProfileBeat,
  updateProfileConstraint,
} from "@yougan/domain";
import {
  getActiveTurnKind,
  getProfile,
  getState,
  patchPendingProfile,
} from "#agent/state-io/index.js";

function requireProfileMode(config: object): string | null {
  if (getActiveTurnKind(getState()) !== "profile") {
    return "作品方案工具仅在 profile 模式可用。";
  }
  return null;
}

export const updateProfileSpec = tool(
  async (input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }

    const updates = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );
    if (!Object.keys(updates).length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "未提供需要更新的创作规格。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const profile = getProfile(getState());
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已更新作品方案创作规格。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(getState(), patchProfileSpec(profile, updates)),
      },
    });
  },
  {
    name: "update_profile_spec",
    description:
      "写入或更新创作主题、体裁、媒介形式。换选题/换方向时优先更新 content_topic。仅当用户主动提到发布渠道时才写 platform。",
    schema: z.object({
      platform: z.string().nullable().optional(),
      content_topic: z.string().nullable().optional(),
      content_type: z.string().nullable().optional(),
      content_format: z.string().nullable().optional(),
      media_modality: z.string().nullable().optional(),
    }),
  },
);

export const updateProfileVoice = tool(
  async (input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }

    const updates = Object.fromEntries(
      Object.entries(input).filter(([, v]) => v !== undefined),
    );
    if (!Object.keys(updates).length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "未提供需要更新的表达设定。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const profile = getProfile(getState());
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已更新作品方案表达设定。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(getState(), patchProfileVoice(profile, updates)),
      },
    });
  },
  {
    name: "update_profile_voice",
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

export const setProfilePremiseTool = tool(
  async ({ premise }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    const trimmed = premise.trim();
    if (!trimmed) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "定位描述不能为空。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    const profile = getProfile(getState());
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已更新作品方案定位。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(getState(), setProfilePremise(profile, trimmed)),
      },
    });
  },
  {
    name: "set_profile_premise",
    description:
      "写入或更新一句话定位。换方向后与新 content_topic 对齐；局部调整时也可单独更新。",
    schema: z.object({
      premise: z.string().describe("这篇内容要讲什么"),
    }),
  },
);

export const addProfileConstraint = tool(
  async ({ description }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    const trimmed = description.trim();
    if (!trimmed) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "写作要求不能为空。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    const profile = getProfile(getState());
    const next = appendProfileConstraint(profile, trimmed);
    if (!next) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "该要求已在方案中。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `已添加写作要求（共 ${next.constraints.length} 条）。`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(getState(), next),
      },
    });
  },
  {
    name: "add_profile_constraint",
    description: "用户确认的非结构性写作要求（语气、禁忌、必提信息等）。",
    schema: z.object({
      description: z.string(),
    }),
  },
);

export const updateProfileConstraintTool = tool(
  async ({ constraint_id, description }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    const trimmed = description.trim();
    if (!trimmed) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "写作要求不能为空。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    const profile = getProfile(getState());
    if (findProfileConstraintIndex(profile, constraint_id) < 0) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: `未找到要求 ${constraint_id}。`,
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已更新写作要求。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(
          getState(),
          updateProfileConstraint(profile, constraint_id, trimmed),
        ),
      },
    });
  },
  {
    name: "update_profile_constraint",
    description: "修改已有写作要求。",
    schema: z.object({
      constraint_id: z.string(),
      description: z.string(),
    }),
  },
);

export const deleteProfileConstraintTool = tool(
  async ({ constraint_id }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    const profile = getProfile(getState());
    if (findProfileConstraintIndex(profile, constraint_id) < 0) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: `未找到要求 ${constraint_id}。`,
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已删除写作要求。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(
          getState(),
          deleteProfileConstraint(profile, constraint_id),
        ),
      },
    });
  },
  {
    name: "delete_profile_constraint",
    description: "删除一条写作要求。",
    schema: z.object({ constraint_id: z.string() }),
  },
);

export const addProfileBeat = tool(
  async ({ description, intent }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    const trimmed = description.trim();
    if (!trimmed) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "节拍描述不能为空。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    const profile = getProfile(getState());
    const next = appendProfileBeat(profile, trimmed, intent);
    if (!next) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "该节拍已在方案中。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `已添加内容节拍（共 ${next.beats.length} 节）。`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(getState(), next),
      },
    });
  },
  {
    name: "add_profile_beat",
    description:
      "追加单条内容节拍。仅新增一节时用；换方向后一次性写多节请用 add_profile_beats。",
    schema: z.object({
      description: z.string(),
      intent: z.string().nullable().optional(),
    }),
  },
);

export const updateProfileBeatTool = tool(
  async ({ beat_id, description, intent }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    const trimmed = description.trim();
    if (!trimmed) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "节拍描述不能为空。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    const profile = getProfile(getState());
    if (findProfileBeatIndex(profile, beat_id) < 0) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: `未找到节拍 ${beat_id}。`,
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已更新内容节拍。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(
          getState(),
          updateProfileBeat(profile, beat_id, trimmed, intent),
        ),
      },
    });
  },
  {
    name: "update_profile_beat",
    description: "修改已有内容节拍。",
    schema: z.object({
      beat_id: z.string(),
      description: z.string(),
      intent: z.string().nullable().optional(),
    }),
  },
);

export const deleteProfileBeatTool = tool(
  async ({ beat_id }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    const profile = getProfile(getState());
    if (findProfileBeatIndex(profile, beat_id) < 0) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: `未找到节拍 ${beat_id}。`,
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已删除内容节拍。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(getState(), deleteProfileBeat(profile, beat_id)),
      },
    });
  },
  {
    name: "delete_profile_beat",
    description: "删除一个内容节拍。",
    schema: z.object({ beat_id: z.string() }),
  },
);

const profileBeatInputSchema = z.object({
  description: z.string().min(1),
  intent: z.string().nullable().optional(),
});

export const addProfileBeats = tool(
  async ({ beats }, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    if (!beats.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "至少提供一条节拍。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }

    const profile = getProfile(getState());
    const next = appendProfileBeats(profile, beats);
    if (next.beats.length === profile.beats.length) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({
              content: "未添加新节拍（均为空或已存在）。",
              tool_call_id: toolCallId,
            }),
          ],
        },
      });
    }
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: `已添加 ${next.beats.length - profile.beats.length} 条内容节拍（共 ${next.beats.length} 节）。`,
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(getState(), next),
      },
    });
  },
  {
    name: "add_profile_beats",
    description:
      "按顺序批量追加多条内容节拍。换方向且已 clear_profile_beats 后，用本工具一次写入新结构。",
    schema: z.object({
      beats: z
        .array(profileBeatInputSchema)
        .min(1)
        .max(8)
        .describe("有序节拍列表，3–8 条为宜"),
    }),
  },
);

export const clearProfileConstraintsTool = tool(
  async (_input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    const profile = getProfile(getState());
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已清空写作要求。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(getState(), clearProfileConstraints(profile)),
      },
    });
  },
  {
    name: "clear_profile_constraints",
    description:
      "清空全部写作要求。换选题/换方向且旧要求不再适用时使用。",
    schema: z.object({}),
  },
);

export const clearProfileBeatsTool = tool(
  async (_input, config) => {
    const toolCallId = (config as ToolRunnableConfig).toolCall?.id ?? "";
    const gate = requireProfileMode(config);
    if (gate) {
      return new Command({
        update: {
          messages: [
            new ToolMessage({ content: gate, tool_call_id: toolCallId }),
          ],
        },
      });
    }
    const profile = getProfile(getState());
    return new Command({
      update: {
        messages: [
          new ToolMessage({
            content: "已清空内容节拍。",
            tool_call_id: toolCallId,
          }),
        ],
        ...patchPendingProfile(getState(), clearProfileBeats(profile)),
      },
    });
  },
  {
    name: "clear_profile_beats",
    description:
      "清空全部内容节拍。换选题/换方向、准备重写结构前使用，之后 set_profile_premise + add_profile_beats。",
    schema: z.object({}),
  },
);
