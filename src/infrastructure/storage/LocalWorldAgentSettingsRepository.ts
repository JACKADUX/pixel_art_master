import type { IWorldAgentSettingsRepository } from "@/application/ports/IWorldAgentSettingsRepository";
import {
  WORLD_AGENT_SETTINGS_VERSION,
  type WorldAgentSettings,
} from "@/domain/world/WorldAgentSettings";

const STORAGE_KEY = "pixelart.world.agentSettings";

interface SerializedWorldAgentSettings extends WorldAgentSettings {
  version: number;
}

export class LocalWorldAgentSettingsRepository implements IWorldAgentSettingsRepository {
  load(): unknown | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed: unknown = JSON.parse(stored);
      if (typeof parsed !== "object" || parsed === null) return null;

      const version = (parsed as SerializedWorldAgentSettings).version;
      if (version !== WORLD_AGENT_SETTINGS_VERSION) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  }

  save(settings: WorldAgentSettings): void {
    try {
      const payload: SerializedWorldAgentSettings = {
        version: WORLD_AGENT_SETTINGS_VERSION,
        ...settings,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota or privacy-mode failures.
    }
  }
}

export const worldAgentSettingsRepository = new LocalWorldAgentSettingsRepository();
