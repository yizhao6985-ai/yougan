import {
  TURN_DIRECTION_PROMPT_MAX_LENGTH,
  TURN_DIRECTION_PROMPT_MIN_LENGTH,
} from "@yougan/domain";

export function buildPromptLengthGuidance(count: number): string {
  const min = TURN_DIRECTION_PROMPT_MIN_LENGTH;
  const max = TURN_DIRECTION_PROMPT_MAX_LENGTH;
  const shortMax = Math.round(min + (max - min) * 0.25);
  const midMax = Math.round(min + (max - min) * 0.6);

  return `

## prompt 篇幅（${min}–${max} 字）
- 每条 prompt 须落在 ${min}–${max} 字（汉字计，含标点）
- ${count} 条之间**长短须明显参差**
- 建议分布：约 1/3 偏短、约 1/3 中等、约 1/3 可稍长
- label 6–16 字，须是 prompt 的口语缩短（禁止单独造栏目名）；outcome 1–2 句（20–60 字），说明走此方向对作品/方案的效果`;
}
