import { colorsEqual, type PixelColor } from "@/domain/canvas/PixelColor";
import type { LuminancePaletteGroup } from "./LuminancePaletteGroup";
import type { LuminancePaletteSwatch } from "./LuminancePaletteSwatch";

export type LuminancePaletteNavigationDirection = "prev" | "next";

/** 快捷键 1-9 → index 0-8，0 → index 9 */
export function shortcutKeyToSwatchIndex(key: string): number | null {
  if (key >= "1" && key <= "9") {
    return Number(key) - 1;
  }
  if (key === "0") {
    return 9;
  }
  return null;
}

/** Alt+1-9 → 组索引 0-8（不含 0 键） */
export function shortcutKeyToGroupIndex(key: string): number | null {
  if (key >= "1" && key <= "9") {
    return Number(key) - 1;
  }
  return null;
}

export function pickGroupByShortcutIndex(
  groups: readonly LuminancePaletteGroup[],
  groupIndex: number,
): LuminancePaletteGroup | null {
  return groups[groupIndex] ?? null;
}

/** 色块在 UI 上显示的快捷键标签 */
export function swatchIndexToShortcutLabel(index: number): string {
  if (index >= 0 && index <= 8) return String(index + 1);
  if (index === 9) return "0";
  return "";
}

export function findGroupContainingColor(
  groups: readonly LuminancePaletteGroup[],
  color: PixelColor,
): LuminancePaletteGroup | null {
  for (const group of groups) {
    if (group.colors.some((swatch) => colorsEqual(swatch.color, color))) {
      return group;
    }
  }
  return null;
}

export function resolveActiveGroup(
  groups: readonly LuminancePaletteGroup[],
  foregroundColor: PixelColor,
  activeGroupId: string | null,
): LuminancePaletteGroup | null {
  const byForeground = findGroupContainingColor(groups, foregroundColor);
  if (byForeground) return byForeground;

  if (activeGroupId) {
    const byId = groups.find((group) => group.id === activeGroupId);
    if (byId) return byId;
  }

  return groups[0] ?? null;
}

export function pickFirstColorInGroup(group: LuminancePaletteGroup): PixelColor | null {
  return group.colors[0]?.color ?? null;
}

export function pickColorByShortcutIndex(
  group: LuminancePaletteGroup,
  shortcutIndex: number,
): PixelColor | null {
  const swatch = group.colors[shortcutIndex];
  return swatch?.color ?? null;
}

export function findSwatchIndexInGroup(
  group: LuminancePaletteGroup,
  color: PixelColor,
): number {
  return group.colors.findIndex((swatch) => colorsEqual(swatch.color, color));
}

export function navigateGroupColor(
  group: LuminancePaletteGroup,
  currentColor: PixelColor,
  direction: LuminancePaletteNavigationDirection,
): PixelColor | null {
  const currentIndex = findSwatchIndexInGroup(group, currentColor);
  if (currentIndex < 0 || group.colors.length === 0) return null;

  const delta = direction === "next" ? 1 : -1;
  const nextIndex =
    (currentIndex + delta + group.colors.length) % group.colors.length;
  return group.colors[nextIndex]?.color ?? null;
}

export function mergeUniqueSwatches(
  existing: readonly LuminancePaletteSwatch[],
  incoming: readonly LuminancePaletteSwatch[],
): LuminancePaletteSwatch[] {
  const seen = new Set(existing.map((swatch) => swatch.hex));
  const merged = existing.map((swatch) => ({ color: swatch.color, hex: swatch.hex }));

  for (const swatch of incoming) {
    if (seen.has(swatch.hex)) continue;
    seen.add(swatch.hex);
    merged.push({ color: swatch.color, hex: swatch.hex });
  }

  return merged;
}
