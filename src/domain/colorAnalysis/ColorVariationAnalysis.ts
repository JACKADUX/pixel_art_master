import type { PixelColor } from "@/domain/canvas/PixelColor";
import { fromHex, toHexAlpha } from "@/domain/canvas/PixelColor";
import { pixelColorToOklch } from "@/domain/color/ColorConverter";
import { OKLCH_MAX_CHROMA, type OklchColor } from "@/domain/color/OklchColor";
import type { ColorEntry } from "@/domain/palette/Palette";

const VALID_HEX_LENGTHS = new Set([3, 4, 6, 8]);
const HEX_CHARS_PATTERN = /^[0-9a-fA-F]+$/;

export interface NormalizedOklch {
  l: number;
  c: number;
  h: number;
}

export interface ColorVariationPoint {
  index: number;
  color: PixelColor;
  hex: string;
  oklch: OklchColor;
  normalized: NormalizedOklch;
  chartHue: number;
}

export interface ColorVariationSeries {
  points: ColorVariationPoint[];
}

function normalizeHexToken(rawLine: string): string | null {
  let token = rawLine.trim();
  if (token.length === 0) return null;
  if (token.startsWith(";") || token.startsWith("//")) return null;
  token = token.replace(/^#/, "");
  if (!VALID_HEX_LENGTHS.has(token.length)) return null;
  if (!HEX_CHARS_PATTERN.test(token)) return null;
  return token;
}

/** 解析颜色列表文本（每行一个 HEX），保留顺序与重复项。 */
export function parseColorListInput(content: string): ColorEntry[] {
  const entries: ColorEntry[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const token = normalizeHexToken(rawLine);
    if (!token) continue;
    const color = fromHex(token);
    entries.push({ color, hex: toHexAlpha(color) });
  }

  return entries;
}

/** 将 OKLCH 归一化到 0–100%，与 PaletteColorTooltip 一致。 */
export function normalizeOklchForChart(oklch: OklchColor): NormalizedOklch {
  return {
    l: oklch.l * 100,
    c: (oklch.c / OKLCH_MAX_CHROMA) * 100,
    h: (oklch.h / 360) * 100,
  };
}

/**
 * 色相展开：使相邻点的 H 折线连续，避免 360°↔0° 跳变。
 * 输入/输出均为 0–100 范围的归一化色相。
 */
export function unwrapHueForChart(hues: number[]): number[] {
  if (hues.length === 0) return [];

  const unwrapped: number[] = [hues[0]!];

  for (let i = 1; i < hues.length; i += 1) {
    let current = hues[i]!;
    const prev = unwrapped[i - 1]!;

    while (current - prev > 50) {
      current -= 100;
    }
    while (prev - current > 50) {
      current += 100;
    }

    unwrapped.push(current);
  }

  return unwrapped;
}

/** 色相最短路径差值（度），例如 350°→10° 为 +20°。 */
export function shortestHueDelta(fromDeg: number, toDeg: number): number {
  let delta = toDeg - fromDeg;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

export function analyzeColorVariation(entries: ColorEntry[]): ColorVariationSeries {
  if (entries.length === 0) {
    return { points: [] };
  }

  const rawPoints = entries.map((entry, index) => {
    const oklch = pixelColorToOklch(entry.color);
    const normalized = normalizeOklchForChart(oklch);
    return {
      index,
      color: entry.color,
      hex: entry.hex,
      oklch,
      normalized,
      chartHue: normalized.h,
    };
  });

  const chartHues = unwrapHueForChart(rawPoints.map((point) => point.normalized.h));

  const points = rawPoints.map((point, index) => ({
    ...point,
    chartHue: chartHues[index]!,
  }));

  return { points };
}
