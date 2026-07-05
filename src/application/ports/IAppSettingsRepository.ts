import type { AppSettings } from "@/domain/appSettings/AppSettings";

export interface IAppSettingsRepository {
  load(softwareDataPath: string): Promise<unknown | null>;
  save(softwareDataPath: string, settings: AppSettings): Promise<void>;
}
