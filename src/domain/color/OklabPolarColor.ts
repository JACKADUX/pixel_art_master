import { normalizeHue } from "./HslColor";
import { OKLAB_MAX_CHROMA, createOklab, type OklabColor } from "./OklabColor";

export interface OklabPolarColor {
  h: number;
  s: number;
  l: number;
}

export function createOklabPolar(h: number, s: number, l: number): OklabPolarColor {
  return {
    h: normalizeHue(h),
    s: clamp(s, 0, 100),
    l: clamp(l, 0, 1),
  };
}

export function oklabToPolar(oklab: OklabColor): OklabPolarColor {
  const chroma = Math.hypot(oklab.a, oklab.b);
  const h =
    chroma === 0 ? 0 : normalizeHue((Math.atan2(oklab.b, oklab.a) * 180) / Math.PI);
  const s = Math.min(100, (chroma / OKLAB_MAX_CHROMA) * 100);
  return createOklabPolar(h, s, oklab.l);
}

export function polarToOklab(polar: OklabPolarColor): OklabColor {
  const chroma = (clamp(polar.s, 0, 100) / 100) * OKLAB_MAX_CHROMA;
  const hRad = (normalizeHue(polar.h) * Math.PI) / 180;
  return createOklab(
    polar.l,
    chroma * Math.cos(hRad),
    chroma * Math.sin(hRad),
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
