import { fetchReferenceAssetBuffer } from "./asset-fetch.js";

/** 送入 LLM 的原文上限（字符），避免超大文件占满上下文 */
const MAX_INPUT_CHARS = 48_000;

export async function prepareReferenceText(url: string): Promise<string> {
  const buffer = await fetchReferenceAssetBuffer(url);
  const raw = buffer.toString("utf-8").trim();
  if (!raw) return "";

  return raw.length > MAX_INPUT_CHARS
    ? `${raw.slice(0, MAX_INPUT_CHARS)}\n\n…（原文已截断，仅分析以上片段）`
    : raw;
}
