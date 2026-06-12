export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export function createHsl(h: number, s: number, l: number): HslColor {
  return {
    h: normalizeHue(h),
    s: clamp(s, 0, 100),
    l: clamp(l, 0, 100),
  };
}

export function normalizeHue(h: number): number {
  const normalized = h % 360;
  return normalized < 0 ? normalized + 360 : normalized;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
