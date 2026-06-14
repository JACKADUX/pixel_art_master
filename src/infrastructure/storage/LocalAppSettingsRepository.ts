import type { IAppSettingsRepository } from "@/application/ports/IAppSettingsRepository";
import {
  APP_SETTINGS_VERSION,
  type AppSettings,
} from "@/domain/appSettings/AppSettings";

const STORAGE_KEY = "pixelart.app.settings";

interface SerializedAppSettings extends AppSettings {
  version: number;
}

export class LocalAppSettingsRepository implements IAppSettingsRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const version = (parsed as SerializedAppSettings).version;
      if (version !== APP_SETTINGS_VERSION) return null;

      return parsed;
    } catch {
      return null;
    }
  }

  save(settings: AppSettings): void {
    try {
      const payload: SerializedAppSettings = {
        version: APP_SETTINGS_VERSION,
        ...settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }
}

export const appSettingsRepository = new LocalAppSettingsRepository();
