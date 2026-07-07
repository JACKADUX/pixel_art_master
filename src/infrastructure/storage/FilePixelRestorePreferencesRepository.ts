import type { IPixelRestorePreferencesRepository } from "@/application/ports/IPixelRestorePreferencesRepository";
import {
  PIXEL_RESTORE_PREFERENCES_VERSION,
  type PixelRestorePreferences,
} from "@/domain/pixelRestore/PixelRestorePreferences";
import { buildPixelRestorePreferencesPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedPixelRestorePreferences extends PixelRestorePreferences {
  version: number;
}

export class FilePixelRestorePreferencesRepository implements IPixelRestorePreferencesRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(buildPixelRestorePreferencesPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const version = (parsed as SerializedPixelRestorePreferences).version;
    if (version !== 1 && version !== 2 && version !== PIXEL_RESTORE_PREFERENCES_VERSION) {
      return null;
    }

    return parsed;
  }

  async save(softwareDataPath: string, prefs: PixelRestorePreferences): Promise<void> {
    const payload: SerializedPixelRestorePreferences = {
      version: PIXEL_RESTORE_PREFERENCES_VERSION,
      ...prefs,
    };
    await writeUserDataJson(
      softwareDataPath,
      buildPixelRestorePreferencesPath(softwareDataPath),
      payload,
    );
  }
}

export const pixelRestorePreferencesRepository = new FilePixelRestorePreferencesRepository();
