import type { MediaModalityId } from "../content/catalog.js";
import type { ReferenceItem } from "./reference.js";

/** 创作规格与形态（platform 保留兼容，不作为创作门禁） */
export interface ProfileSpec {
  platform?: string | null;
  content_topic?: string | null;
  content_type?: string | null;
  content_format?: string | null;
  /** 媒介原子组合，如 ["text", "image"] */
  media_modalities?: MediaModalityId[];
}

/** 表达设定 */
export interface ProfileVoice {
  audience?: string | null;
  tone?: string | null;
  style?: string | null;
  persona?: string | null;
  goals?: string[];
}

/** 非结构性写作要求 */
export interface ProfileConstraint {
  id: string;
  description: string;
  confirmed_at: string;
}

/** 有序内容节拍 */
export interface ProfileBeat {
  id: string;
  description: string;
  intent?: string | null;
  confirmed_at: string;
}

/** 作品创作轮廓（用户可见）：规格、表达、参考、结构与节拍 */
export interface WorkProfile {
  spec: ProfileSpec;
  voice: ProfileVoice;
  premise: string;
  /** 参考素材，属于创作轮廓的一部分 */
  references: ReferenceItem[];
  constraints: ProfileConstraint[];
  beats: ProfileBeat[];
}

export const EMPTY_PROFILE_SPEC: ProfileSpec = {
  platform: null,
  content_topic: null,
  content_type: null,
  content_format: null,
  media_modalities: [],
};

export const EMPTY_PROFILE_VOICE: ProfileVoice = {
  audience: null,
  tone: null,
  style: null,
  persona: null,
  goals: [],
};

export const EMPTY_WORK_PROFILE: WorkProfile = {
  spec: { ...EMPTY_PROFILE_SPEC },
  voice: { ...EMPTY_PROFILE_VOICE },
  premise: "",
  references: [],
  constraints: [],
  beats: [],
};
