import type { PixelRestorePreferences } from "@/domain/pixelRestore/PixelRestorePreferences";

export interface IPixelRestorePreferencesRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, prefs: PixelRestorePreferences): Promise<void>;
}
