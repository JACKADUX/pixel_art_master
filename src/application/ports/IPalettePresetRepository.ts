import type { PalettePresetLibrary } from "@/domain/palette/PalettePresetLibrary";

export interface IPalettePresetRepository {
  load(): unknown | null;
  save(library: PalettePresetLibrary): void;
}
