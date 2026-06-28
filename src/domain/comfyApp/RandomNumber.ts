/** 随机数生成器组件可生成的最大正整数（2^32-1，对常见 seed 输入安全） */
export const MAX_RANDOM_INTEGER = 0xffffffff;

/** 生成 [1, max] 范围内的随机正整数 */
export function generateRandomPositiveInteger(max: number = MAX_RANDOM_INTEGER): number {
  const upper = Math.max(1, Math.floor(max));
  return Math.floor(Math.random() * upper) + 1;
}
