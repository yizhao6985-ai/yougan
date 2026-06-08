/**
 * LangChain human 消息多模态 content part。
 *
 * 用户附件：{ url, mime_type, original_name? }（与 HumanAttachmentAsset 同形）
 *
 * HumanImage* 类型仅用于 Agent 内部 LLM 视觉调用，不写入用户 human message。
 */

export type HumanTextContentPart = { type: "text"; text: string };

export type HumanImageUrlContentPart = {
  type: "image";
  source_type: "url";
  url: string;
};

export type HumanImageBase64ContentPart = {
  type: "image";
  source_type: "base64";
  mime_type: string;
  data: string;
};

export type HumanImageIdContentPart = {
  type: "image";
  source_type: "id";
  id: string;
};

export type HumanImageContentPart =
  | HumanImageUrlContentPart
  | HumanImageBase64ContentPart
  | HumanImageIdContentPart;

/** human message 中的附件块（仅 URL 来源） */
export type HumanAssetContentPart = {
  url: string;
  mime_type: string;
  original_name?: string | null;
};

export type HumanMessageContentPart =
  | HumanTextContentPart
  | HumanAssetContentPart;

/** 已上传、可写入 human message 的附件（composer / agent 共用） */
export type HumanAttachmentAsset = {
  url: string;
  mime_type: string;
  original_name?: string | null;
};
