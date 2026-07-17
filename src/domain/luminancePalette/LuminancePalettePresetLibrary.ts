import type { LuminancePaletteData } from "./LuminancePalette";
import type { LuminancePalettePreset } from "./LuminancePalettePreset";
import {
  createLuminancePalettePreset,
  renameLuminancePalettePreset,
  updateLuminancePalettePresetData,
} from "./LuminancePalettePreset";

export const LUMINANCE_PALETTE_PRESET_LIBRARY_VERSION = 1;

export interface LuminancePalettePresetLibrary {
  version: number;
  presets: LuminancePalettePreset[];
}

export function createEmptyLuminancePalettePresetLibrary(): LuminancePalettePresetLibrary {
  return {
    version: LUMINANCE_PALETTE_PRESET_LIBRARY_VERSION,
    presets: [],
  };
}

export function listLuminancePalettePresets(
  library: LuminancePalettePresetLibrary,
): LuminancePalettePreset[] {
  return [...library.presets].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getLuminancePalettePreset(
  library: LuminancePalettePresetLibrary,
  id: string,
): LuminancePalettePreset | null {
  return library.presets.find((preset) => preset.id === id) ?? null;
}

export function addLuminancePalettePreset(
  library: LuminancePalettePresetLibrary,
  data: Pick<LuminancePaletteData, "groups" | "groupArrangement">,
  name?: string,
): { library: LuminancePalettePresetLibrary; preset: LuminancePalettePreset } {
  const preset = createLuminancePalettePreset(data, name);
  return {
    library: { ...library, presets: [...library.presets, preset] },
    preset,
  };
}

export function removeLuminancePalettePreset(
  library: LuminancePalettePresetLibrary,
  id: string,
): LuminancePalettePresetLibrary {
  return {
    ...library,
    presets: library.presets.filter((preset) => preset.id !== id),
  };
}

export function renameLuminancePalettePresetInLibrary(
  library: LuminancePalettePresetLibrary,
  id: string,
  name: string,
): LuminancePalettePresetLibrary {
  return {
    ...library,
    presets: library.presets.map((preset) =>
      preset.id === id ? renameLuminancePalettePreset(preset, name) : preset,
    ),
  };
}

export function updateLuminancePalettePresetInLibrary(
  library: LuminancePalettePresetLibrary,
  id: string,
  data: Pick<LuminancePaletteData, "groups" | "groupArrangement">,
): LuminancePalettePresetLibrary {
  return {
    ...library,
    presets: library.presets.map((preset) =>
      preset.id === id ? updateLuminancePalettePresetData(preset, data) : preset,
    ),
  };
}
