import type { IAppSettingsRepository } from "@/application/ports/IAppSettingsRepository";
import {
  APP_SETTINGS_VERSION,
  type AppSettings,
} from "@/domain/appSettings/AppSettings";
import { buildAppSettingsPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedAppSettings extends AppSettings {
  version: number;
}

export class FileAppSettingsRepository implements IAppSettingsRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(buildAppSettingsPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const version = (parsed as SerializedAppSettings).version;
    if (version !== APP_SETTINGS_VERSION) return null;

    return parsed;
  }

  async save(softwareDataPath: string, settings: AppSettings): Promise<void> {
    const payload: SerializedAppSettings = {
      version: APP_SETTINGS_VERSION,
      ...settings,
    };
    await writeUserDataJson(softwareDataPath, buildAppSettingsPath(softwareDataPath), payload);
  }
}

export const appSettingsRepository = new FileAppSettingsRepository();
