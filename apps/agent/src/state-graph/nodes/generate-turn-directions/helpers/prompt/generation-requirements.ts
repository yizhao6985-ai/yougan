import { buildPromptLengthGuidance } from "./message-length.js";

export function buildGenerationRequirements(
  count: number,
  options?: {
    titleAnchored?: boolean;
  },
): string {
  const primarySource = options?.titleAnchored
    ? "根据前述**作品标题**（优先于空方案状态）"
    : "根据**作品当前状态**";

  return `

## 生成要求
1. ${primarySource}给出**具体可执行**的下一步建议
2. **先写 prompt**（用户会发的完整话），再从中压缩出 label；两条须同一口吻、同一意图
3. 已有方案或成稿时：承接已有主题，禁止当成空白重来
4. 恰好 ${count} 条；每条是用户可直接发送的不同切入点，互斥、可区分
5. outcome 说明走此方向后作品会进入什么状态${buildPromptLengthGuidance(count)}`;
}
