import type { IColorEditPreferencesRepository } from "@/application/ports/IColorEditPreferencesRepository";
import {
  COLOR_EDIT_PREFERENCES_VERSION,
  type ColorEditPreferences,
} from "@/domain/colorEdit/ColorEditPreferences";
import { buildColorEditPreferencesPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedColorEditPreferences extends ColorEditPreferences {
  version: number;
}

export class FileColorEditPreferencesRepository implements IColorEditPreferencesRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(buildColorEditPreferencesPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const version = (parsed as SerializedColorEditPreferences).version;
    if (
      version !== 2 &&
      version !== 3 &&
      version !== 4 &&
      version !== 5 &&
      version !== 6 &&
      version !== COLOR_EDIT_PREFERENCES_VERSION
    ) {
      return null;
    }

    return parsed;
  }

  async save(softwareDataPath: string, prefs: ColorEditPreferences): Promise<void> {
    const payload: SerializedColorEditPreferences = {
      version: COLOR_EDIT_PREFERENCES_VERSION,
      ...prefs,
    };
    await writeUserDataJson(
      softwareDataPath,
      buildColorEditPreferencesPath(softwareDataPath),
      payload,
    );
  }
}

export const colorEditPreferencesRepository = new FileColorEditPreferencesRepository();
