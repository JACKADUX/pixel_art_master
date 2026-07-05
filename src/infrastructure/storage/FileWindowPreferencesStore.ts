import type { IWindowPreferencesStore } from "@/application/ports/IWindowPreferencesStore";
import { buildWindowAlwaysOnTopPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedWindowPreferences {
  alwaysOnTop: boolean;
}

export class FileWindowPreferencesStore implements IWindowPreferencesStore {
  async loadAlwaysOnTop(softwareDataPath: string): Promise<boolean> {
    const parsed = await readUserDataJson(buildWindowAlwaysOnTopPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return false;
    return Boolean((parsed as SerializedWindowPreferences).alwaysOnTop);
  }

  async saveAlwaysOnTop(softwareDataPath: string, alwaysOnTop: boolean): Promise<void> {
    const payload: SerializedWindowPreferences = { alwaysOnTop };
    await writeUserDataJson(
      softwareDataPath,
      buildWindowAlwaysOnTopPath(softwareDataPath),
      payload,
    );
  }
}

export const windowPreferencesStore = new FileWindowPreferencesStore();
