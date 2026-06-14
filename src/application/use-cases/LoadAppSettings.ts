import { parseAppSettings, type AppSettings } from "@/domain/appSettings/AppSettings";
import type { IAppSettingsRepository } from "../ports/IAppSettingsRepository";

export function loadAppSettings(repository: IAppSettingsRepository): AppSettings {
  const raw = repository.load();
  if (raw === null) {
    return parseAppSettings(null);
  }
  return parseAppSettings(raw);
}
