import type { IPixelRestorePreferencesRepository } from "@/application/ports/IPixelRestorePreferencesRepository";
import {
  PIXEL_RESTORE_PREFERENCES_VERSION,
  type PixelRestorePreferences,
} from "@/domain/pixelRestore/PixelRestorePreferences";

const STORAGE_KEY = "pixelart-pixel-restore-preferences";

interface SerializedPixelRestorePreferences extends PixelRestorePreferences {
  version: number;
}

export class LocalPixelRestorePreferencesRepository implements IPixelRestorePreferencesRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const version = (parsed as SerializedPixelRestorePreferences).version;
      if (version !== 1 && version !== PIXEL_RESTORE_PREFERENCES_VERSION) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  save(prefs: PixelRestorePreferences): void {
    try {
      const payload: SerializedPixelRestorePreferences = {
        version: PIXEL_RESTORE_PREFERENCES_VERSION,
        ...prefs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }
}

export const pixelRestorePreferencesRepository = new LocalPixelRestorePreferencesRepository();
