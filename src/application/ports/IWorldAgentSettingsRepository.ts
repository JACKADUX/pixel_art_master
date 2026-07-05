import type { WorldAgentSettings } from "@/domain/world/WorldAgentSettings";

export interface IWorldAgentSettingsRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, settings: WorldAgentSettings): Promise<void>;
}
