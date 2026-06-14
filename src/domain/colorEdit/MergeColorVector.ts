import type { PixelColor } from "../canvas/PixelColor";
import { pixelColorToHsl, pixelColorToOklab } from "../color/ColorConverter";
import { normalizeHue } from "../color/HslColor";

/** 饱和度低于此阈值视为无彩色，距离计算忽略 hue。 */
export const ACHROMATIC_SATURATION_THRESHOLD = 1;

export interface MergeColorVector {
  h: number;
  s: number;
  l: number;
}

export function circularHueDelta(h1: number, h2: number): number {
  const delta = Math.abs(normalizeHue(h1) - normalizeHue(h2));
  return Math.min(delta, 360 - delta);
}

function isAchromaticSaturation(sPercent: number): boolean {
  return sPercent <= ACHROMATIC_SATURATION_THRESHOLD;
}

export function pixelToMergeVector(color: PixelColor): MergeColorVector {
  const hsl = pixelColorToHsl(color);
  const oklab = pixelColorToOklab(color);
  return {
    h: hsl.h,
    s: hsl.s / 100,
    l: oklab.l,
  };
}

export function mergeVectorDistance(a: MergeColorVector, b: MergeColorVector): number {
  const ds = a.s - b.s;
  const dl = a.l - b.l;

  const aAchromatic = isAchromaticSaturation(a.s * 100);
  const bAchromatic = isAchromaticSaturation(b.s * 100);

  if (aAchromatic || bAchromatic) {
    return Math.sqrt(ds * ds + dl * dl);
  }

  const dh = circularHueDelta(a.h, b.h) / 180;
  return Math.sqrt(dh * dh + ds * ds + dl * dl);
}
