import type { ColorEntry } from "./Palette";
import type { PalettePreset } from "./PalettePreset";
import {
  createPalettePreset,
  renamePalettePreset,
  updatePalettePresetColors,
} from "./PalettePreset";

export const PALETTE_PRESET_LIBRARY_VERSION = 1;

export interface PalettePresetLibrary {
  version: number;
  presets: PalettePreset[];
}

export function createEmptyPalettePresetLibrary(): PalettePresetLibrary {
  return {
    version: PALETTE_PRESET_LIBRARY_VERSION,
    presets: [],
  };
}

export function listPalettePresets(library: PalettePresetLibrary): PalettePreset[] {
  return [...library.presets].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getPalettePreset(
  library: PalettePresetLibrary,
  id: string,
): PalettePreset | null {
  return library.presets.find((p) => p.id === id) ?? null;
}

export function addPalettePreset(
  library: PalettePresetLibrary,
  colors: readonly ColorEntry[],
  name?: string,
): { library: PalettePresetLibrary; preset: PalettePreset } {
  const preset = createPalettePreset(colors, name);
  return {
    library: { ...library, presets: [...library.presets, preset] },
    preset,
  };
}

export function removePalettePreset(
  library: PalettePresetLibrary,
  id: string,
): PalettePresetLibrary {
  return {
    ...library,
    presets: library.presets.filter((p) => p.id !== id),
  };
}

export function renamePalettePresetInLibrary(
  library: PalettePresetLibrary,
  id: string,
  name: string,
): PalettePresetLibrary {
  return {
    ...library,
    presets: library.presets.map((preset) =>
      preset.id === id ? renamePalettePreset(preset, name) : preset,
    ),
  };
}

export function updatePresetColorsInLibrary(
  library: PalettePresetLibrary,
  id: string,
  colors: readonly ColorEntry[],
): PalettePresetLibrary {
  return {
    ...library,
    presets: library.presets.map((preset) =>
      preset.id === id ? updatePalettePresetColors(preset, colors) : preset,
    ),
  };
}
