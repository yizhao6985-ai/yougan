/** 创作规格与形态（platform 保留兼容，不作为创作门禁） */
export interface BlueprintSpec {
  platform?: string | null;
  content_topic?: string | null;
  content_type?: string | null;
  content_format?: string | null;
  media_modality?: string | null;
}

/** 表达设定 */
export interface BlueprintVoice {
  audience?: string | null;
  tone?: string | null;
  style?: string | null;
  persona?: string | null;
  goals?: string[];
}

/** 非结构性写作要求 */
export interface BlueprintConstraint {
  id: string;
  description: string;
  confirmed_at: string;
}

/** 有序内容节拍 */
export interface BlueprintBeat {
  id: string;
  description: string;
  intent?: string | null;
  confirmed_at: string;
}

/** 作品方案：合并原 brief + outline + profile 中的创作意图 */
export interface WorkBlueprint {
  spec: BlueprintSpec;
  voice: BlueprintVoice;
  premise: string;
  constraints: BlueprintConstraint[];
  beats: BlueprintBeat[];
}

export const EMPTY_BLUEPRINT_SPEC: BlueprintSpec = {
  platform: null,
  content_topic: null,
  content_type: null,
  content_format: null,
  media_modality: null,
};

export const EMPTY_BLUEPRINT_VOICE: BlueprintVoice = {
  audience: null,
  tone: null,
  style: null,
  persona: null,
  goals: [],
};

export const EMPTY_WORK_BLUEPRINT: WorkBlueprint = {
  spec: { ...EMPTY_BLUEPRINT_SPEC },
  voice: { ...EMPTY_BLUEPRINT_VOICE },
  premise: "",
  constraints: [],
  beats: [],
};
