import type { AppSettings } from "@/domain/appSettings/AppSettings";
import type { IAppSettingsRepository } from "../ports/IAppSettingsRepository";

export async function saveAppSettings(
  repository: IAppSettingsRepository,
  softwareDataPath: string,
  settings: AppSettings,
): Promise<void> {
  await repository.save(softwareDataPath, settings);
}
