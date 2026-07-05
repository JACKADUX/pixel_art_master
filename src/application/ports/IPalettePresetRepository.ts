import type { PalettePresetLibrary } from "@/domain/palette/PalettePresetLibrary";

export interface IPalettePresetRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, library: PalettePresetLibrary): Promise<void>;
}
