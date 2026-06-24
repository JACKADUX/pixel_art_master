import { rgbToOklab } from "./ColorConverter";

export type CanvasDisplayMode = "normal" | "oklchLightness";

/** OKLCH L channel (0–1) from sRGB bytes. Coefficients match ColorConverter.rgbToOklab. */
export function oklchLightnessFromRgb(r: number, g: number, b: number): number {
  return rgbToOklab(r, g, b).l;
}
