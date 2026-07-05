import { Palette } from "@/domain/palette/Palette";
import type { PalettePreset } from "@/domain/palette/PalettePreset";
import {
  getDefaultPalettePreset,
  type PalettePresetLibrary,
} from "@/domain/palette/PalettePresetLibrary";
import type { CanvasSize } from "@/domain/canvas/CanvasSize";
import { createEmptyProject, touchProject, type Project } from "@/domain/project/Project";

export type PalettePresetImportMode = "merge" | "replace";

export function resolveInitialPaletteFromLibrary(
  library: PalettePresetLibrary,
): Palette {
  const preset = getDefaultPalettePreset(library);
  if (!preset || preset.colors.length === 0) return Palette.empty();
  return Palette.fromJSON(preset.colors);
}

export function createEmptyProjectWithDefaultPalette(
  library: PalettePresetLibrary,
  name?: string,
  size?: CanvasSize,
): Project {
  return {
    ...createEmptyProject(name, size),
    palette: resolveInitialPaletteFromLibrary(library),
  };
}

export function importPresetIntoPalette(
  project: Project,
  preset: PalettePreset,
  mode: PalettePresetImportMode,
): Project {
  const nextPalette =
    mode === "replace"
      ? Palette.fromJSON(preset.colors)
      : project.palette.withAddedColors(preset.colors.map((c) => c.color));

  return touchProject({
    ...project,
    palette: nextPalette,
  });
}
