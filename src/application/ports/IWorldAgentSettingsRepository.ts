import type { WorldAgentSettings } from "@/domain/world/WorldAgentSettings";

export interface IWorldAgentSettingsRepository {
  load(): unknown | null;
  save(settings: WorldAgentSettings): void;
}
