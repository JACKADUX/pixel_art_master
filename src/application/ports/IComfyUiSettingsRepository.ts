import type { ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";

export interface IComfyUiSettingsRepository {
  load(softwareDataPath: string): Promise<ComfyServerConfig | null>;
  save(softwareDataPath: string, config: ComfyServerConfig): Promise<void>;
  loadOutputClassTypes(softwareDataPath: string): Promise<string[] | null>;
  saveOutputClassTypes(softwareDataPath: string, types: string[]): Promise<void>;
}
