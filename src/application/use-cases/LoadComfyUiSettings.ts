import { createComfyServerConfig, type ComfyServerConfig } from "@/domain/comfyui/ComfyServerConfig";
import type { IComfyUiSettingsRepository } from "../ports/IComfyUiSettingsRepository";

export async function loadComfyUiSettings(
  repository: IComfyUiSettingsRepository,
  softwareDataPath: string,
): Promise<ComfyServerConfig> {
  const stored = await repository.load(softwareDataPath);
  if (!stored) {
    return createComfyServerConfig();
  }
  return createComfyServerConfig(stored.address);
}
