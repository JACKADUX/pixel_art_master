/** 宽高比例组件的领域纯函数：预设比例、按最大边计算宽高、长宽互换 */

export interface AspectRatioPreset {
  /** 唯一标识，同时用于展示，如 "16:9" */
  id: string;
  label: string;
  w: number;
  h: number;
}

/** 应用层提供的内置比例预设 */
export const ASPECT_RATIO_PRESETS: AspectRatioPreset[] = [
  { id: "16:9", label: "16:9", w: 16, h: 9 },
  { id: "4:3", label: "4:3", w: 4, h: 3 },
  { id: "3:2", label: "3:2", w: 3, h: 2 },
  { id: "1:1", label: "1:1", w: 1, h: 1 },
];

/** 自由宽高的特殊比例 id（不按比例计算，直接使用 width/height） */
export const FREE_RATIO_ID = "free";

export type RatioOrientation = "landscape" | "portrait";

export interface RatioSizeValue {
  width: number;
  height: number;
}

export function findAspectRatioPreset(id: string): AspectRatioPreset | undefined {
  return ASPECT_RATIO_PRESETS.find((preset) => preset.id === id);
}

/** 将数值对齐到 step 的整数倍（step <= 1 时仅取整并保证 >= 1） */
function snapToStep(value: number, step: number): number {
  if (!Number.isFinite(value)) return Math.max(1, step > 1 ? step : 1);
  if (step <= 1) return Math.max(1, Math.round(value));
  return Math.max(step, Math.round(value / step) * step);
}

/**
 * 按比例与「最大边」计算宽高。
 * 最大边总是分配给较长的一侧，orientation 决定横/竖向。
 */
export function computeRatioSize(
  ratio: { w: number; h: number },
  maxEdge: number,
  orientation: RatioOrientation,
  step = 1,
): RatioSizeValue {
  const longSide = Math.max(1, Math.round(maxEdge));
  const ratioLong = Math.max(ratio.w, ratio.h);
  const ratioShort = Math.min(ratio.w, ratio.h);
  const rawShort = ratioLong === 0 ? longSide : (longSide * ratioShort) / ratioLong;

  const long = snapToStep(longSide, step);
  const short = snapToStep(rawShort, step);

  return orientation === "landscape"
    ? { width: long, height: short }
    : { width: short, height: long };
}

/** 交换宽高 */
export function swapDimensions(value: RatioSizeValue): RatioSizeValue {
  return { width: value.height, height: value.width };
}

/** 根据已有宽高推断初始的方向与最大边（用于初始化组件状态） */
export function deriveRatioState(
  width: number,
  height: number,
): { orientation: RatioOrientation; maxEdge: number } {
  const safeWidth = Number.isFinite(width) ? width : 0;
  const safeHeight = Number.isFinite(height) ? height : 0;
  return {
    orientation: safeWidth >= safeHeight ? "landscape" : "portrait",
    maxEdge: Math.max(1, Math.round(Math.max(safeWidth, safeHeight))),
  };
}
