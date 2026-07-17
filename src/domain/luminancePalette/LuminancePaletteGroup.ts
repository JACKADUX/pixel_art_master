import type { ColorEntry } from "@/domain/palette/Palette";
import {
  createLuminancePaletteSwatch,
  type LuminancePaletteSwatch,
} from "./LuminancePaletteSwatch";

export const LUMINANCE_PALETTE_MAX_SWATCHES = 10;

/** 编辑模式尾部虚拟空组占位 ID（不入库） */
export const LUMINANCE_TRAILING_EMPTY_GROUP_ID = "__luminance_trailing_empty__";

export function isVirtualTrailingEmptyGroup(groupId: string): boolean {
  return groupId === LUMINANCE_TRAILING_EMPTY_GROUP_ID;
}

export function createVirtualTrailingEmptyGroup(groupIndex: number): LuminancePaletteGroup {
  return createLuminancePaletteGroup(
    [],
    formatDefaultLuminanceGroupName(groupIndex),
    LUMINANCE_TRAILING_EMPTY_GROUP_ID,
  );
}

export interface LuminancePaletteGroup {
  id: string;
  name: string;
  colors: LuminancePaletteSwatch[];
}

export function formatDefaultLuminanceGroupName(index: number): string {
  return `组 ${index}`;
}

export function createLuminancePaletteGroup(
  colors: readonly LuminancePaletteSwatch[] = [],
  name?: string,
  id: string = crypto.randomUUID(),
): LuminancePaletteGroup {
  return {
    id,
    name: name?.trim() || formatDefaultLuminanceGroupName(1),
    colors: colors.slice(0, LUMINANCE_PALETTE_MAX_SWATCHES).map((swatch) => ({
      color: swatch.color,
      hex: swatch.hex,
    })),
  };
}

export function createLuminancePaletteGroupFromColorEntries(
  entries: readonly ColorEntry[],
  name?: string,
): LuminancePaletteGroup {
  return createLuminancePaletteGroup(
    entries.map((entry) => createLuminancePaletteSwatch(entry.color)),
    name,
  );
}

export function renameLuminancePaletteGroup(
  group: LuminancePaletteGroup,
  name: string,
): LuminancePaletteGroup {
  const trimmed = name.trim();
  if (!trimmed || trimmed === group.name) return group;
  return { ...group, name: trimmed };
}

export function withGroupColors(
  group: LuminancePaletteGroup,
  colors: readonly LuminancePaletteSwatch[],
): LuminancePaletteGroup {
  return {
    ...group,
    colors: colors.slice(0, LUMINANCE_PALETTE_MAX_SWATCHES).map((swatch) => ({
      color: swatch.color,
      hex: swatch.hex,
    })),
  };
}
