import type { ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";
import type { IComfyUiSettingsRepository } from "../ports/IComfyUiSettingsRepository";

export async function saveComfyUiSettings(
  repository: IComfyUiSettingsRepository,
  softwareDataPath: string,
  config: ComfyServerConfig,
): Promise<void> {
  await repository.save(softwareDataPath, config);
}
