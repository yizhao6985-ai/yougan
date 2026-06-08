/**
 * LangChain human 消息多模态 content part。
 *
 * 图片块：{ type: "image", source_type: "url" | "base64" | "id", ... }
 * 其他附件：{ type: "asset", source_type: "url", url, mime_type, original_name? }
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

export type HumanAssetUrlContentPart = {
  type: "asset";
  source_type: "url";
  url: string;
  mime_type: string;
  original_name?: string | null;
};

export type HumanMessageContentPart =
  | HumanTextContentPart
  | HumanImageContentPart
  | HumanAssetUrlContentPart;

/** 已上传、可写入 human message 的附件（composer / agent 共用） */
export type HumanAttachmentAsset = {
  url: string;
  mime_type: string;
  original_name?: string | null;
};
