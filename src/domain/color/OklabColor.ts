export interface OklabColor {
  l: number;
  a: number;
  b: number;
}

export const OKLAB_MAX_CHROMA = 0.4;
export const OKLAB_A_RANGE = OKLAB_MAX_CHROMA;
export const OKLAB_B_RANGE = OKLAB_MAX_CHROMA;

export function createOklab(l: number, a: number, b: number): OklabColor {
  return {
    l: clamp(l, 0, 1),
    a: clamp(a, -OKLAB_A_RANGE, OKLAB_A_RANGE),
    b: clamp(b, -OKLAB_B_RANGE, OKLAB_B_RANGE),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
