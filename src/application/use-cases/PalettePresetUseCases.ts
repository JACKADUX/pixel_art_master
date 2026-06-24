import { Palette } from "@/domain/palette/Palette";
import type { PalettePreset } from "@/domain/palette/PalettePreset";
import { touchProject, type Project } from "@/domain/project/Project";

export type PalettePresetImportMode = "merge" | "replace";

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
