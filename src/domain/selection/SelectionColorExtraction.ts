import { getAlpha, toHexAlpha, type PixelColor } from "@/domain/canvas/PixelColor";
import type { WritableCanvasSurface } from "@/domain/canvas/MaskedPixelGrid";
import type { ColorEntry } from "@/domain/palette/Palette";
import type { FloatingSelection } from "./FloatingSelection";
import { isMaskSelected, type SelectionMask } from "./SelectionMask";
import type { SelectionState } from "./SelectionState";

/** 按扫描顺序提取唯一颜色（保留首次出现顺序，跳过透明像素）。 */
export function buildColorEntriesInScanOrder(colors: Iterable<PixelColor>): ColorEntry[] {
  const seen = new Set<string>();
  const entries: ColorEntry[] = [];

  for (const color of colors) {
    if (getAlpha(color) === 0) continue;
    const hex = toHexAlpha(color);
    if (seen.has(hex)) continue;
    seen.add(hex);
    entries.push({ color, hex });
  }

  return entries;
}

export function extractColorsFromFloatingSelection(
  floating: FloatingSelection,
): ColorEntry[] {
  const colors: PixelColor[] = [];
  const { pixels } = floating;

  for (let y = 0; y < pixels.height; y += 1) {
    for (let x = 0; x < pixels.width; x += 1) {
      colors.push(pixels.getPixel(x, y));
    }
  }

  return buildColorEntriesInScanOrder(colors);
}

export function extractColorsFromMaskedGrid(
  grid: WritableCanvasSurface,
  mask: SelectionMask,
): ColorEntry[] {
  const colors: PixelColor[] = [];

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      if (!isMaskSelected(mask, x, y)) continue;
      colors.push(grid.getPixel(x, y));
    }
  }

  return buildColorEntriesInScanOrder(colors);
}

export function extractColorsFromSelection(
  grid: WritableCanvasSurface,
  selection: SelectionState,
): ColorEntry[] {
  if (selection.floating) {
    return extractColorsFromFloatingSelection(selection.floating);
  }
  return extractColorsFromMaskedGrid(grid, selection.mask);
}
