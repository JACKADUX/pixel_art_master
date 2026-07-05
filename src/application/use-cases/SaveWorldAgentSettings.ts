import type { WorldAgentSettings } from "@/domain/world/WorldAgentSettings";
import type { IWorldAgentSettingsRepository } from "../ports/IWorldAgentSettingsRepository";

export async function saveWorldAgentSettings(
  repository: IWorldAgentSettingsRepository,
  softwareDataPath: string,
  settings: WorldAgentSettings,
): Promise<void> {
  await repository.save(softwareDataPath, settings);
}
