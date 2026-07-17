import { getAlpha } from "@/domain/canvas/PixelColor";
import type { LuminancePaletteGroup } from "./LuminancePaletteGroup";
import { withGroupColors } from "./LuminancePaletteGroup";
import type { LuminancePaletteSwatch } from "./LuminancePaletteSwatch";
import type { LuminancePaletteData } from "./LuminancePalette";

export function isOpaqueLuminanceSwatch(swatch: LuminancePaletteSwatch): boolean {
  return getAlpha(swatch.color) > 0;
}

export function filterOpaqueSwatches(
  swatches: readonly LuminancePaletteSwatch[],
): LuminancePaletteSwatch[] {
  return swatches.filter(isOpaqueLuminanceSwatch);
}

export function sanitizeLuminancePaletteGroup(
  group: LuminancePaletteGroup,
): LuminancePaletteGroup {
  return withGroupColors(group, filterOpaqueSwatches(group.colors));
}

export function pruneEmptyLuminancePaletteGroups(
  palette: LuminancePaletteData,
): LuminancePaletteData {
  const groups = palette.groups
    .map(sanitizeLuminancePaletteGroup)
    .filter((group) => group.colors.length > 0);

  const activeStillExists = groups.some((group) => group.id === palette.activeGroupId);
  return {
    ...palette,
    groups,
    activeGroupId: activeStillExists ? palette.activeGroupId : (groups[0]?.id ?? null),
  };
}

export function finalizeLuminancePalette(
  palette: LuminancePaletteData,
  options: { keepEmptyGroups?: boolean } = {},
): LuminancePaletteData {
  const sanitizedGroups = palette.groups.map(sanitizeLuminancePaletteGroup);
  const next: LuminancePaletteData = { ...palette, groups: sanitizedGroups };
  if (options.keepEmptyGroups) return next;
  return pruneEmptyLuminancePaletteGroups(next);
}

export function moveLuminancePaletteGroup(
  palette: LuminancePaletteData,
  groupId: string,
  direction: "left" | "right",
): LuminancePaletteData {
  const index = palette.groups.findIndex((group) => group.id === groupId);
  if (index < 0) return palette;

  const targetIndex = direction === "left" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= palette.groups.length) return palette;

  const groups = [...palette.groups];
  const current = groups[index];
  const target = groups[targetIndex];
  if (!current || !target) return palette;

  groups[index] = target;
  groups[targetIndex] = current;

  return { ...palette, groups, activeGroupId: groupId };
}
