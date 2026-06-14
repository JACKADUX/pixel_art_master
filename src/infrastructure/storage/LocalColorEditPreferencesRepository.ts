import type { IColorEditPreferencesRepository } from "@/application/ports/IColorEditPreferencesRepository";
import {
  COLOR_EDIT_PREFERENCES_VERSION,
  type ColorEditPreferences,
} from "@/domain/colorEdit/ColorEditPreferences";

const STORAGE_KEY = "pixelart.colorEdit.preferences";

interface SerializedColorEditPreferences extends ColorEditPreferences {
  version: number;
}

export class LocalColorEditPreferencesRepository implements IColorEditPreferencesRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const version = (parsed as SerializedColorEditPreferences).version;
      if (version !== 2 && version !== COLOR_EDIT_PREFERENCES_VERSION) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  save(prefs: ColorEditPreferences): void {
    try {
      const payload: SerializedColorEditPreferences = {
        version: COLOR_EDIT_PREFERENCES_VERSION,
        ...prefs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }
}

export const colorEditPreferencesRepository = new LocalColorEditPreferencesRepository();
