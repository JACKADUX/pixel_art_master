import type { AppSettings } from "@/domain/appSettings/AppSettings";

export interface IAppSettingsRepository {
  load(): unknown | null;
  save(settings: AppSettings): void;
}
