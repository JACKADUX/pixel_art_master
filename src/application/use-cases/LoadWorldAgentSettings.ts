import {
  parseWorldAgentSettings,
  type WorldAgentSettings,
} from "@/domain/world/WorldAgentSettings";
import type { IWorldAgentSettingsRepository } from "../ports/IWorldAgentSettingsRepository";

export async function loadWorldAgentSettings(
  repository: IWorldAgentSettingsRepository,
  softwareDataPath: string,
): Promise<WorldAgentSettings> {
  return parseWorldAgentSettings(await repository.load(softwareDataPath));
}
