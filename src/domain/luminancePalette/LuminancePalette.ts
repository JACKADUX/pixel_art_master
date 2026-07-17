import type { PixelColor } from "@/domain/canvas/PixelColor";
import { colorsEqual, getAlpha } from "@/domain/canvas/PixelColor";
import type { ColorEntry } from "@/domain/palette/Palette";
import {
  createLuminancePaletteGroup,
  formatDefaultLuminanceGroupName,
  LUMINANCE_PALETTE_MAX_SWATCHES,
  withGroupColors,
  type LuminancePaletteGroup,
} from "./LuminancePaletteGroup";
import { mergeUniqueSwatches } from "./LuminancePaletteNavigation";
import {
  createLuminancePaletteSwatch,
  luminancePaletteSwatchFromHex,
} from "./LuminancePaletteSwatch";
import { sortSwatchesByOklchLightnessDesc } from "./LuminancePaletteSort";
import { finalizeLuminancePalette, moveLuminancePaletteGroup } from "./LuminancePaletteSanitize";

export type LuminancePaletteGroupArrangement = "vertical" | "horizontal";

export interface LuminancePaletteData {
  groups: LuminancePaletteGroup[];
  groupArrangement: LuminancePaletteGroupArrangement;
  activeGroupId: string | null;
}

export interface SerializedLuminancePaletteSwatch {
  hex: string;
}

export interface SerializedLuminancePaletteGroup {
  id: string;
  name: string;
  colors: SerializedLuminancePaletteSwatch[];
}

export interface SerializedLuminancePalette {
  groups: SerializedLuminancePaletteGroup[];
  groupArrangement: LuminancePaletteGroupArrangement;
  activeGroupId: string | null;
}

export function createEmptyLuminancePalette(): LuminancePaletteData {
  return {
    groups: [],
    groupArrangement: "vertical",
    activeGroupId: null,
  };
}

export function luminancePaletteFromJSON(
  data: SerializedLuminancePalette | null | undefined,
): LuminancePaletteData {
  if (!data || !Array.isArray(data.groups)) {
    return createEmptyLuminancePalette();
  }

  const groups = data.groups
    .map((group) => {
      if (!group || typeof group.id !== "string") return null;
      const colors = Array.isArray(group.colors)
        ? group.colors
            .filter((item) => item && typeof item.hex === "string")
            .map((item) => luminancePaletteSwatchFromHex(item.hex))
        : [];
      return createLuminancePaletteGroup(
        sortSwatchesByOklchLightnessDesc(colors),
        typeof group.name === "string" ? group.name : undefined,
        group.id,
      );
    })
    .filter((group): group is LuminancePaletteGroup => group !== null);

  return finalizeLuminancePalette({
    groups,
    groupArrangement: data.groupArrangement === "horizontal" ? "horizontal" : "vertical",
    activeGroupId: typeof data.activeGroupId === "string" ? data.activeGroupId : null,
  });
}

export function luminancePaletteToJSON(
  palette: LuminancePaletteData,
): SerializedLuminancePalette {
  return {
    groups: palette.groups.map((group) => ({
      id: group.id,
      name: group.name,
      colors: group.colors.map((swatch) => ({ hex: swatch.hex })),
    })),
    groupArrangement: palette.groupArrangement,
    activeGroupId: palette.activeGroupId,
  };
}

export function setLuminancePaletteGroupArrangement(
  palette: LuminancePaletteData,
  arrangement: LuminancePaletteGroupArrangement,
): LuminancePaletteData {
  return { ...palette, groupArrangement: arrangement };
}

export function setLuminancePaletteActiveGroupId(
  palette: LuminancePaletteData,
  groupId: string | null,
): LuminancePaletteData {
  return { ...palette, activeGroupId: groupId };
}

export function addLuminancePaletteGroup(
  palette: LuminancePaletteData,
  group?: LuminancePaletteGroup,
  options: { keepEmptyGroups?: boolean } = {},
): LuminancePaletteData {
  const nextGroup =
    group ??
    createLuminancePaletteGroup(
      [],
      formatDefaultLuminanceGroupName(palette.groups.length + 1),
    );
  return finalizeLuminancePalette(
    {
      ...palette,
      groups: [...palette.groups, nextGroup],
      activeGroupId: nextGroup.id,
    },
    { keepEmptyGroups: options.keepEmptyGroups },
  );
}

export function removeLuminancePaletteGroup(
  palette: LuminancePaletteData,
  groupId: string,
): LuminancePaletteData {
  const groups = palette.groups.filter((group) => group.id !== groupId);
  const activeGroupId =
    palette.activeGroupId === groupId ? (groups[0]?.id ?? null) : palette.activeGroupId;
  return { ...palette, groups, activeGroupId };
}

export function renameLuminancePaletteGroupInPalette(
  palette: LuminancePaletteData,
  groupId: string,
  name: string,
): LuminancePaletteData {
  return {
    ...palette,
    groups: palette.groups.map((group) =>
      group.id === groupId ? { ...group, name: name.trim() || group.name } : group,
    ),
  };
}

function updateGroup(
  palette: LuminancePaletteData,
  groupId: string,
  updater: (group: LuminancePaletteGroup) => LuminancePaletteGroup,
): LuminancePaletteData {
  return {
    ...palette,
    activeGroupId: groupId,
    groups: palette.groups.map((group) =>
      group.id === groupId ? updater(group) : group,
    ),
  };
}

function sortGroupColors(group: LuminancePaletteGroup): LuminancePaletteGroup {
  return withGroupColors(group, sortSwatchesByOklchLightnessDesc(group.colors));
}

export type AddColorToGroupResult =
  | { ok: true; palette: LuminancePaletteData }
  | { ok: false; reason: "group_not_found" | "group_full" | "duplicate" | "transparent" };

export function addColorToLuminanceGroup(
  palette: LuminancePaletteData,
  groupId: string,
  color: PixelColor,
): AddColorToGroupResult {
  const group = palette.groups.find((item) => item.id === groupId);
  if (!group) return { ok: false, reason: "group_not_found" };
  if (getAlpha(color) === 0) return { ok: false, reason: "transparent" };
  if (group.colors.length >= LUMINANCE_PALETTE_MAX_SWATCHES) {
    return { ok: false, reason: "group_full" };
  }
  if (group.colors.some((swatch) => colorsEqual(swatch.color, color))) {
    return { ok: false, reason: "duplicate" };
  }

  const nextColors = sortSwatchesByOklchLightnessDesc([
    ...group.colors,
    createLuminancePaletteSwatch(color),
  ]);

  return {
    ok: true,
    palette: finalizeLuminancePalette(
      updateGroup(palette, groupId, (current) =>
        sortGroupColors(withGroupColors(current, nextColors)),
      ),
    ),
  };
}

export function removeSwatchFromLuminanceGroup(
  palette: LuminancePaletteData,
  groupId: string,
  swatchIndex: number,
  options: { keepEmptyGroups?: boolean } = {},
): LuminancePaletteData {
  const updated = updateGroup(palette, groupId, (group) => {
    const nextColors = group.colors.filter((_, index) => index !== swatchIndex);
    return withGroupColors(group, nextColors);
  });
  return finalizeLuminancePalette(updated, options);
}

export type SetSwatchColorResult =
  | { ok: true; palette: LuminancePaletteData }
  | {
      ok: false;
      reason: "group_not_found" | "group_full" | "transparent" | "index_out_of_range";
    };

export function setLuminanceSwatchColorAtIndex(
  palette: LuminancePaletteData,
  groupId: string,
  swatchIndex: number,
  color: PixelColor,
  options: { resort?: boolean; keepEmptyGroups?: boolean } = {},
): SetSwatchColorResult {
  const group = palette.groups.find((item) => item.id === groupId);
  if (!group) return { ok: false, reason: "group_not_found" };
  if (getAlpha(color) === 0) return { ok: false, reason: "transparent" };
  if (swatchIndex < 0 || swatchIndex >= LUMINANCE_PALETTE_MAX_SWATCHES) {
    return { ok: false, reason: "index_out_of_range" };
  }

  const newSwatch = createLuminancePaletteSwatch(color);
  const isReplacing = swatchIndex < group.colors.length;

  let nextColors: typeof group.colors;
  if (isReplacing) {
    let colors = [...group.colors];
    for (let i = colors.length - 1; i >= 0; i--) {
      if (i !== swatchIndex && colorsEqual(colors[i]!.color, color)) {
        colors.splice(i, 1);
      }
    }

    let adjustedIndex = swatchIndex;
    for (let i = 0; i < swatchIndex; i++) {
      if (colorsEqual(group.colors[i]!.color, color)) {
        adjustedIndex--;
      }
    }

    if (adjustedIndex < colors.length) {
      colors[adjustedIndex] = newSwatch;
    } else if (colors.length >= LUMINANCE_PALETTE_MAX_SWATCHES) {
      return { ok: false, reason: "group_full" };
    } else {
      colors.push(newSwatch);
    }
    nextColors = colors;
  } else {
    const deduped = group.colors.filter((swatch) => !colorsEqual(swatch.color, color));
    if (deduped.length >= LUMINANCE_PALETTE_MAX_SWATCHES) {
      return { ok: false, reason: "group_full" };
    }
    nextColors = [...deduped, newSwatch];
  }

  const sortedColors =
    options.resort === false
      ? nextColors
      : sortSwatchesByOklchLightnessDesc(nextColors);

  const updated = updateGroup(palette, groupId, (current) =>
    withGroupColors(current, sortedColors),
  );

  return {
    ok: true,
    palette: finalizeLuminancePalette(updated, {
      keepEmptyGroups: options.keepEmptyGroups,
    }),
  };
}

export function replaceLuminanceSwatchColorLive(
  palette: LuminancePaletteData,
  groupId: string,
  swatchIndex: number,
  color: PixelColor,
): SetSwatchColorResult {
  return setLuminanceSwatchColorAtIndex(palette, groupId, swatchIndex, color, {
    resort: false,
    keepEmptyGroups: true,
  });
}

export function finalizeLiveEditSwatch(
  palette: LuminancePaletteData,
  groupId: string,
): LuminancePaletteData {
  return updateGroup(palette, groupId, sortGroupColors);
}

export { moveLuminancePaletteGroup };

export function importColorsToLuminanceGroup(
  palette: LuminancePaletteData,
  groupId: string,
  entries: readonly ColorEntry[],
): AddColorToGroupResult {
  const group = palette.groups.find((item) => item.id === groupId);
  if (!group) return { ok: false, reason: "group_not_found" };

  const incoming = entries.map((entry) => createLuminancePaletteSwatch(entry.color));
  const merged = mergeUniqueSwatches(group.colors, incoming);
  if (merged.length > LUMINANCE_PALETTE_MAX_SWATCHES) {
    return { ok: false, reason: "group_full" };
  }

  return {
    ok: true,
    palette: finalizeLuminancePalette(
      updateGroup(palette, groupId, (current) =>
        sortGroupColors(withGroupColors(current, merged)),
      ),
    ),
  };
}

export function replaceLuminancePaletteData(
  palette: LuminancePaletteData,
  data: Pick<LuminancePaletteData, "groups" | "groupArrangement">,
): LuminancePaletteData {
  const groups = data.groups.map((group) =>
    sortGroupColors(
      withGroupColors(
        group,
        sortSwatchesByOklchLightnessDesc(group.colors),
      ),
    ),
  );
  const activeStillExists = groups.some((group) => group.id === palette.activeGroupId);
  return finalizeLuminancePalette({
    groups,
    groupArrangement: data.groupArrangement,
    activeGroupId: activeStillExists ? palette.activeGroupId : (groups[0]?.id ?? null),
  });
}
