import { rgba, toRgbComponents, type PixelColor } from "@/domain/canvas/PixelColor";
import { createHsl, normalizeHue, type HslColor } from "./HslColor";
import { createOklab, type OklabColor } from "./OklabColor";
import { oklabToPolar, polarToOklab, type OklabPolarColor, createOklabPolar } from "./OklabPolarColor";

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number): number {
  const c = channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;
  return Math.round(clamp(c * 255, 0, 255));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function rgbToHsl(r: number, g: number, b: number): HslColor {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = ((max + min) / 2) * 100;

  if (delta === 0) {
    return createHsl(0, 0, l);
  }

  const s = (delta / (1 - Math.abs((2 * l) / 100 - 1))) * 100;
  let h = 0;

  if (max === rn) {
    h = ((gn - bn) / delta) % 6;
  } else if (max === gn) {
    h = (bn - rn) / delta + 2;
  } else {
    h = (rn - gn) / delta + 4;
  }

  return createHsl(h * 60, s, l);
}

export function hslToRgb(hsl: HslColor): { r: number; g: number; b: number } {
  const h = normalizeHue(hsl.h) / 360;
  const s = clamp(hsl.s, 0, 100) / 100;
  const l = clamp(hsl.l, 0, 100) / 100;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

export function rgbToOklab(r: number, g: number, b: number): OklabColor {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);

  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  return createOklab(
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  );
}

export function oklabToRgb(oklab: OklabColor): { r: number; g: number; b: number } {
  const lRoot = oklab.l + 0.3963377774 * oklab.a + 0.2158037573 * oklab.b;
  const mRoot = oklab.l - 0.1055613458 * oklab.a - 0.0638541728 * oklab.b;
  const sRoot = oklab.l - 0.0894841775 * oklab.a - 1.291485548 * oklab.b;

  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;

  const lr = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  return {
    r: linearToSrgb(lr),
    g: linearToSrgb(lg),
    b: linearToSrgb(lb),
  };
}

export function pixelColorToHsl(color: PixelColor): HslColor {
  const { r, g, b } = toRgbComponents(color);
  return rgbToHsl(r, g, b);
}

export function pixelColorToOklab(color: PixelColor): OklabColor {
  const { r, g, b } = toRgbComponents(color);
  return rgbToOklab(r, g, b);
}

export function pixelColorToOklabPolar(color: PixelColor): OklabPolarColor {
  return oklabToPolar(pixelColorToOklab(color));
}

export function oklabPolarToPixelColor(polar: OklabPolarColor, alpha = 255): PixelColor {
  return oklabToPixelColor(polarToOklab(polar), alpha);
}

export function oklabPlaneColorAt(h: number, s: number, l: number, alpha = 255): PixelColor {
  return oklabPolarToPixelColor(createOklabPolar(h, s, l), alpha);
}

export function hslToPixelColor(hsl: HslColor, alpha = 255): PixelColor {
  const { r, g, b } = hslToRgb(hsl);
  return rgba(r, g, b, alpha);
}

export function oklabToPixelColor(oklab: OklabColor, alpha = 255): PixelColor {
  const { r, g, b } = oklabToRgb(oklab);
  return rgba(r, g, b, alpha);
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
