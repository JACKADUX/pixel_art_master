import type { AppSettings } from "@/domain/appSettings/AppSettings";
import type { IAppSettingsRepository } from "../ports/IAppSettingsRepository";

export function saveAppSettings(repository: IAppSettingsRepository, settings: AppSettings): void {
  repository.save(settings);
}
