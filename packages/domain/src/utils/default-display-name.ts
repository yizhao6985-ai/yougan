const DEFAULT_NAME_SUFFIXES = [
  "小鹿",
  "青柠",
  "星光",
  "云朵",
  "麦芽",
  "拾光",
  "微风",
  "晚风",
  "晨光",
  "浮光",
  "清欢",
  "半糖",
  "远山",
  "眠猫",
  "溪声",
  "白鸽",
  "松果",
  "柚子",
  "竹影",
  "潮汐",
  "星尘",
  "雨眠",
  "晴日",
  "行歌",
  "留白",
  "浅唱",
  "方舟",
  "枕书",
  "晚星",
  "初雪",
  "听风",
  "观澜",
] as const;

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** 根据稳定 seed（如 userId / 手机号）生成「有感青柠」风格默认昵称 */
export function generateDefaultDisplayName(seed: string): string {
  const index = hashSeed(seed) % DEFAULT_NAME_SUFFIXES.length;
  return `有感${DEFAULT_NAME_SUFFIXES[index]}`;
}
