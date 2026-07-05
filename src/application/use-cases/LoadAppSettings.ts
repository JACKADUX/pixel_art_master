import { parseAppSettings, type AppSettings } from "@/domain/appSettings/AppSettings";
import type { IAppSettingsRepository } from "../ports/IAppSettingsRepository";

export async function loadAppSettings(
  repository: IAppSettingsRepository,
  softwareDataPath: string,
): Promise<AppSettings> {
  const raw = await repository.load(softwareDataPath);
  if (raw === null) {
    return parseAppSettings(null);
  }
  return parseAppSettings(raw);
}
