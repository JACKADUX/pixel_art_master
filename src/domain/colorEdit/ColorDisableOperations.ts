import { getAlpha, rgba, toRgbComponents, type PixelColor } from "../canvas/PixelColor";
import { pixelColorToOklab } from "../color/ColorConverter";
import type { ColorPaletteStats } from "./ColorPaletteStats";
import { weightedDeltaE } from "./OklabMergeDistance";

function readPixelColor(data: Uint8ClampedArray, index: number): PixelColor {
  const offset = index * 4;
  return rgba(data[offset], data[offset + 1], data[offset + 2], data[offset + 3]);
}

function writePixelColor(
  data: Uint8ClampedArray,
  index: number,
  color: PixelColor,
  preserveAlpha: boolean,
  sourceAlpha: number,
): void {
  const offset = index * 4;
  const { r, g, b } = toRgbComponents(color);
  const alpha = preserveAlpha ? sourceAlpha : getAlpha(color);
  data[offset] = r;
  data[offset + 1] = g;
  data[offset + 2] = b;
  data[offset + 3] = alpha;
}

function collectUniqueColors(imageData: ImageData): PixelColor[] {
  const seen = new Set<PixelColor>();
  const colors: PixelColor[] = [];
  const { width, height, data } = imageData;
  const pixelCount = width * height;

  for (let index = 0; index < pixelCount; index += 1) {
    const color = readPixelColor(data, index);
    if (getAlpha(color) === 0) continue;
    if (seen.has(color)) continue;
    seen.add(color);
    colors.push(color);
  }

  return colors;
}

export function findNearestPaletteColor(
  target: PixelColor,
  candidates: readonly PixelColor[],
): PixelColor | null {
  if (candidates.length === 0) return null;

  const targetOklab = pixelColorToOklab(target);
  let bestColor = candidates[0];
  let bestDistance = weightedDeltaE(targetOklab, pixelColorToOklab(bestColor));

  for (let index = 1; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const distance = weightedDeltaE(targetOklab, pixelColorToOklab(candidate));
    if (distance < bestDistance) {
      bestColor = candidate;
      bestDistance = distance;
    }
  }

  return bestColor;
}

export function filterDisabledColorsInPalette(
  palette: ColorPaletteStats,
  disabledColors: readonly PixelColor[],
): PixelColor[] {
  const paletteColors = new Set(palette.colors.map((entry) => entry.color));
  return disabledColors.filter((color) => paletteColors.has(color));
}

export function buildDisabledColorReplacementMap(
  imageData: ImageData,
  disabledColors: readonly PixelColor[],
): Map<PixelColor, PixelColor> {
  const disabledSet = new Set(disabledColors);
  if (disabledSet.size === 0) return new Map();

  const uniqueColors = collectUniqueColors(imageData);
  const remainingColors = uniqueColors.filter((color) => !disabledSet.has(color));
  if (remainingColors.length === 0) return new Map();

  const replacementMap = new Map<PixelColor, PixelColor>();
  for (const disabled of disabledSet) {
    const replacement = findNearestPaletteColor(disabled, remainingColors);
    if (replacement !== null) {
      replacementMap.set(disabled, replacement);
    }
  }

  return replacementMap;
}

export function applyDisabledColors(
  imageData: ImageData,
  disabledColors: readonly PixelColor[],
): ImageData {
  const replacementMap = buildDisabledColorReplacementMap(imageData, disabledColors);
  if (replacementMap.size === 0) return imageData;

  const { width, height, data } = imageData;
  const resultData = new Uint8ClampedArray(data);
  const pixelCount = width * height;

  for (let index = 0; index < pixelCount; index += 1) {
    const sourceColor = readPixelColor(data, index);
    if (getAlpha(sourceColor) === 0) continue;

    const replacement = replacementMap.get(sourceColor);
    if (replacement === undefined) continue;

    writePixelColor(
      resultData,
      index,
      replacement,
      getAlpha(replacement) === 255,
      getAlpha(sourceColor),
    );
  }

  return { width, height, data: resultData } as ImageData;
}
