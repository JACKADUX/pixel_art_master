import type { IWorldAgentSettingsRepository } from "@/application/ports/IWorldAgentSettingsRepository";
import {
  WORLD_AGENT_SETTINGS_VERSION,
  type WorldAgentSettings,
} from "@/domain/world/WorldAgentSettings";
import { buildWorldAgentSettingsPath } from "@/domain/softwareDataPath/UserDataPaths";
import {
  readUserDataJson,
  writeUserDataJson,
} from "@/infrastructure/storage/FileUserDataHelper";

interface SerializedWorldAgentSettings extends WorldAgentSettings {
  version: number;
}

export class FileWorldAgentSettingsRepository implements IWorldAgentSettingsRepository {
  async load(softwareDataPath: string): Promise<unknown | null> {
    const parsed = await readUserDataJson(buildWorldAgentSettingsPath(softwareDataPath));
    if (typeof parsed !== "object" || parsed === null) return null;

    const version = (parsed as SerializedWorldAgentSettings).version;
    if (version !== WORLD_AGENT_SETTINGS_VERSION) {
      return null;
    }

    return parsed;
  }

  async save(softwareDataPath: string, settings: WorldAgentSettings): Promise<void> {
    const payload: SerializedWorldAgentSettings = {
      version: WORLD_AGENT_SETTINGS_VERSION,
      ...settings,
    };
    await writeUserDataJson(
      softwareDataPath,
      buildWorldAgentSettingsPath(softwareDataPath),
      payload,
    );
  }
}

export const worldAgentSettingsRepository = new FileWorldAgentSettingsRepository();
