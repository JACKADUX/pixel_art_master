import type { WorldAgentSettings } from "@/domain/world/WorldAgentSettings";
import type { IWorldAgentSettingsRepository } from "../ports/IWorldAgentSettingsRepository";

export function saveWorldAgentSettings(
  repository: IWorldAgentSettingsRepository,
  settings: WorldAgentSettings,
): void {
  repository.save(settings);
}
