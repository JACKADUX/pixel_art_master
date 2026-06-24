import { normalizeHue } from "./HslColor";
import { OKLAB_MAX_CHROMA, createOklab, type OklabColor } from "./OklabColor";

export const OKLCH_MAX_CHROMA = OKLAB_MAX_CHROMA;

export interface OklchColor {
  l: number;
  c: number;
  h: number;
}

export function createOklch(l: number, c: number, h: number): OklchColor {
  return {
    l: clamp(l, 0, 1),
    c: clamp(c, 0, OKLCH_MAX_CHROMA),
    h: normalizeHue(h),
  };
}

export function oklabToOklch(oklab: OklabColor): OklchColor {
  const c = Math.hypot(oklab.a, oklab.b);
  const h = c === 0 ? 0 : normalizeHue((Math.atan2(oklab.b, oklab.a) * 180) / Math.PI);
  return createOklch(oklab.l, c, h);
}

export function oklchToOklab(oklch: OklchColor): OklabColor {
  const hRad = (normalizeHue(oklch.h) * Math.PI) / 180;
  return createOklab(oklch.l, oklch.c * Math.cos(hRad), oklch.c * Math.sin(hRad));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
