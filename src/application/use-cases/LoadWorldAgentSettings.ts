import {
  parseWorldAgentSettings,
  type WorldAgentSettings,
} from "@/domain/world/WorldAgentSettings";
import type { IWorldAgentSettingsRepository } from "../ports/IWorldAgentSettingsRepository";

export function loadWorldAgentSettings(
  repository: IWorldAgentSettingsRepository,
): WorldAgentSettings {
  return parseWorldAgentSettings(repository.load());
}
