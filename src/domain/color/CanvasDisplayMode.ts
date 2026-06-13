import { rgbToOklab } from "./ColorConverter";

export type CanvasDisplayMode = "normal" | "oklabLightness";

/** Oklab L channel (0–1) from sRGB bytes. Coefficients match ColorConverter.rgbToOklab. */
export function oklabLightnessFromRgb(r: number, g: number, b: number): number {
  return rgbToOklab(r, g, b).l;
}
