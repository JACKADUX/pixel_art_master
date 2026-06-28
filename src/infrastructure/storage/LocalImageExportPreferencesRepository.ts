import type { IImageExportPreferencesRepository } from "@/application/ports/IImageExportPreferencesRepository";
import {
  IMAGE_EXPORT_PREFERENCES_VERSION,
  parseImageExportPreferences,
  type ImageExportPreferences,
} from "@/domain/export/ImageExportPreferences";

const STORAGE_KEY = "pixelart-image-export-preferences";

interface SerializedImageExportPreferences extends ImageExportPreferences {
  version: typeof IMAGE_EXPORT_PREFERENCES_VERSION;
}

export class LocalImageExportPreferencesRepository implements IImageExportPreferencesRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const version = (parsed as SerializedImageExportPreferences).version;
      if (version !== IMAGE_EXPORT_PREFERENCES_VERSION) return null;

      return parsed;
    } catch {
      return null;
    }
  }

  save(prefs: ImageExportPreferences): void {
    try {
      const payload: SerializedImageExportPreferences = {
        version: IMAGE_EXPORT_PREFERENCES_VERSION,
        ...prefs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }
}

export const imageExportPreferencesRepository = new LocalImageExportPreferencesRepository();

export function loadImageExportPreferences(
  repository: IImageExportPreferencesRepository = imageExportPreferencesRepository,
): ImageExportPreferences {
  return parseImageExportPreferences(repository.load());
}
