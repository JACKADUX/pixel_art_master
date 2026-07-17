import type { LuminancePalettePresetLibrary } from "@/domain/luminancePalette/LuminancePalettePresetLibrary";

export interface ILuminancePalettePresetRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, library: LuminancePalettePresetLibrary): Promise<void>;
}
