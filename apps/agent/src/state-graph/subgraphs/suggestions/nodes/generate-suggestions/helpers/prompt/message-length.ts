import {
  NEXT_STEP_SUGGESTION_MESSAGE_MAX_LENGTH,
  NEXT_STEP_SUGGESTION_MESSAGE_MIN_LENGTH,
} from "@yougan/domain";

export function buildMessageLengthGuidance(count: number): string {
  const { min, max } = {
    min: NEXT_STEP_SUGGESTION_MESSAGE_MIN_LENGTH,
    max: NEXT_STEP_SUGGESTION_MESSAGE_MAX_LENGTH,
  };
  const shortMax = Math.round(min + (max - min) * 0.25);
  const midMax = Math.round(min + (max - min) * 0.6);

  return `

## message 篇幅（${min}–${max} 字）
- 每条须落在 ${min}–${max} 字（汉字计，含标点）；可 1–2 句，勿为凑字啰嗦
- ${count} 条之间**长短须明显参差**，禁止几乎等长或同一模板套壳
- 建议分布：约 1/3 偏短（${min}–${shortMax} 字，开门见山）、约 1/3 中等（${shortMax + 1}–${midMax} 字）、约 1/3 可稍长（${midMax + 1}–${max} 字，补上对象/切口/形式）
- 短例：「想做霓虹夜景赛博插画」；长例：「我想做一组赛博朋克城市插画，面向科幻爱好者，偏霓虹夜景与雨夜反光」`;
}
