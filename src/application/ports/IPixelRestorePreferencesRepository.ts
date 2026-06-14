import type { PixelRestorePreferences } from "@/domain/pixelRestore/PixelRestorePreferences";

export interface IPixelRestorePreferencesRepository {
  load(): unknown | null;
  save(prefs: PixelRestorePreferences): void;
}
